package auth

import (
	"errors"
	"time"

	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/models"
	"github.com/aalroudhan/unspam/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

// Service handles registration, login, and JWT issuance.
type Service struct {
	users  *repository.UserRepository
	secret string
}

func NewService(users *repository.UserRepository, cfg *config.Config) *Service {
	return &Service{users: users, secret: cfg.JWTSecret}
}

func (s *Service) Register(email, password string) (string, error) {
	existing, err := s.users.FindByEmail(email)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return "", ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", err
	}

	user := &models.User{Email: email, PasswordHash: string(hash)}
	if err := s.users.Save(user); err != nil {
		return "", err
	}
	return s.sign(user)
}

func (s *Service) Login(email, password string) (string, error) {
	user, err := s.users.FindByEmail(email)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return "", ErrInvalidCredentials
	}
	return s.sign(user)
}

func (s *Service) ValidateByID(id string) (*models.User, error) {
	return s.users.FindByID(id)
}

func (s *Service) sign(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

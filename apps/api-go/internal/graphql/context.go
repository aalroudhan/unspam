package graphql

import (
	"context"
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const userIDKey ctxKey = "userID"

// ErrUnauthenticated is returned by resolvers that require a logged-in user.
var ErrUnauthenticated = errors.New("authentication required")

// AuthContextMiddleware extracts a valid Bearer JWT (if present) and stores the
// user ID on the request context. Unlike the REST middleware it never aborts —
// GraphQL authorization is enforced per-resolver, so public queries still run
// for anonymous callers.
func AuthContextMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if sub, ok := claims["sub"].(string); ok && sub != "" {
						ctx := context.WithValue(c.Request.Context(), userIDKey, sub)
						c.Request = c.Request.WithContext(ctx)
					}
				}
			}
		}
		c.Next()
	}
}

// userIDFromContext returns the authenticated user ID stored by the middleware.
func userIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok && id != ""
}

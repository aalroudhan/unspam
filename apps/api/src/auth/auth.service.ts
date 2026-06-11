import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<{ token: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.users.save({ email, passwordHash });
    return { token: this.sign(user) };
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return { token: this.sign(user) };
  }

  async validateById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  private sign(user: User): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}

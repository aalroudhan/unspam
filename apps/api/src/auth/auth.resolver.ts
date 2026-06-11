import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from './entities/user.entity';
import { AuthToken, LoginInput, RegisterInput } from './auth.types';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthToken)
  register(@Args('input') input: RegisterInput): Promise<AuthToken> {
    return this.auth.register(input.email, input.password);
  }

  @Mutation(() => AuthToken)
  login(@Args('input') input: LoginInput): Promise<AuthToken> {
    return this.auth.login(input.email, input.password);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }
}

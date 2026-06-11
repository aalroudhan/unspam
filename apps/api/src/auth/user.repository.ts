import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly orm: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.orm.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.orm.findOne({ where: { id } });
  }

  save(user: Partial<User>): Promise<User> {
    return this.orm.save(this.orm.create(user));
  }
}

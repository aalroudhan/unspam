import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('community_flags')
export class CommunityFlag {
  @Field()
  @PrimaryColumn()
  callerNumber: string;

  @Field(() => Int)
  @Column({ default: 0 })
  flagCount: number;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

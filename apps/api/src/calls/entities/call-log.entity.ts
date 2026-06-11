import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

export enum InterceptionMode {
  TWILIO = 'twilio',
  NATIVE = 'native',
}

export enum CallOutcome {
  BLOCKED = 'blocked',
  VOICEMAIL = 'voicemail',
  ALLOWED = 'allowed',
}

// Exposed over GraphQL as their lowercase string values (e.g. "blocked") rather
// than GraphQL enums, to keep the wire contract identical to the REST JSON the
// web clients already consume.

@ObjectType()
@Entity('call_logs')
export class CallLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  callerNumber: string;

  @Field(() => Float)
  @Column('float')
  spamScore: number;

  @Field(() => String)
  @Column({ type: 'enum', enum: CallOutcome })
  outcome: CallOutcome;

  @Field(() => String)
  @Column({ type: 'enum', enum: InterceptionMode })
  mode: InterceptionMode;

  @Field({ nullable: true })
  @Column({ nullable: true })
  carrierType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  carrierName!: string;

  @Field()
  @Column({ default: false })
  isVoip: boolean = false;

  @Field()
  @Column({ default: false })
  isSpoofed: boolean = false;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

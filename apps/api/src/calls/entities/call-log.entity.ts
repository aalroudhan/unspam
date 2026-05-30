import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum InterceptionMode {
  TWILIO = 'twilio',
  NATIVE = 'native',
}

export enum CallOutcome {
  BLOCKED = 'blocked',
  VOICEMAIL = 'voicemail',
  ALLOWED = 'allowed',
}

@Entity('call_logs')
export class CallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callerNumber: string;

  @Column('float')
  spamScore: number;

  @Column({ type: 'enum', enum: CallOutcome })
  outcome: CallOutcome;

  @Column({ type: 'enum', enum: InterceptionMode })
  mode: InterceptionMode;

  @Column({ nullable: true })
  carrierType: string;

  @Column({ nullable: true })
  carrierName!: string;

  @Column({ default: false })
  isVoip: boolean = false;

  @Column({ default: false })
  isSpoofed: boolean = false;

  @CreateDateColumn()
  createdAt: Date;
}

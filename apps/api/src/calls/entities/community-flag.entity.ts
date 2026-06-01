import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('community_flags')
export class CommunityFlag {
  @PrimaryColumn()
  callerNumber: string;

  @Column({ default: 0 })
  flagCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}

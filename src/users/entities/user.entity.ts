import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'text' })
  email: string;

  @Column({ type: 'text' })
  passwordHash: string;

  @Column({ default: 'user', type: 'text' })
  role: string; // 'user' | 'admin'

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: 'text' })
  verificationToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

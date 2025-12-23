import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from '../../servers/entities/server.entity';

@Entity()
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  serverId!: string;

  @Column()
  name!: string;

  @Column()
  sizeBytes!: number;

  @Column({ default: 'COMPLETED' })
  status!: string; // PENDING, COMPLETED, FAILED

  @CreateDateColumn()
  createdAt!: Date;
}

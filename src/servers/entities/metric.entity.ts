import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Server } from './server.entity';

@Entity()
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  serverId: string;

  @ManyToOne(() => Server)
  server: Server;

  @Column('float')
  cpuUsage: number;

  @Column('integer')
  ramUsageMb: number;

  @Column('integer')
  playerCount: number;

  @CreateDateColumn()
  timestamp: Date;
}

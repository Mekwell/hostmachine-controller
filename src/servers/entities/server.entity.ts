import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Node } from '../../nodes/entities/node.entity';

@Entity()
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  nodeId!: string;

  @ManyToOne(() => Node)
  node!: Node;

  @Column()
  gameType!: string;

  @Column({ nullable: true })
  name!: string;

  @Column()
  dockerImage!: string;

  @Column()
  port!: number;

  @Column()
  memoryLimitMb!: number;

  @Column({ default: 'PROVISIONING' })
  status!: string; // PROVISIONING, RUNNING, STOPPED, ERROR

  @Column('simple-json', { nullable: true })
  env!: string[];

  @Column({ default: true })
  autoUpdate!: boolean;

  @Column({ nullable: true })
  restartSchedule!: string; // Cron expression e.g. "0 4 * * *"

  @Column({ nullable: true })
  sftpUsername!: string;

  @Column({ nullable: true })
  sftpPassword!: string;

  @Column({ nullable: true })
  subdomain!: string;

  @Column({ default: 0 })
  playerCount!: number;

  @Column({ type: 'float', default: 0 })
  cpuUsage!: number;

  @Column({ default: 0 })
  ramUsage!: number; // In MB

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPlayerActivity: Date;

  @Column({ default: true })
  hibernationEnabled: boolean;

  @Column({ type: 'simple-json', nullable: true })
  players: { name: string; ping: number; joinedAt: string }[];

  @Column({ type: 'simple-json', nullable: true })
  managedMods: { id: string; name: string; version: string; filename: string; loader: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

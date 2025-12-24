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
  progress!: number; // 0-100 for deployment progress

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

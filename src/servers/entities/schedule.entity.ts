import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Server } from '../../servers/entities/server.entity';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serverId: string;

  @ManyToOne(() => Server)
  server: Server;

  @Column()
  name: string;

  @Column()
  task: 'restart' | 'backup' | 'update' | 'command';

  @Column({ nullable: true })
  payload: string; // Optional command to run

  @Column()
  cronExpression: string; // e.g. "0 4 * * *" (4 AM daily)

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  lastRun: Date;

  @Column({ nullable: true })
  nextRun: Date;

  @CreateDateColumn()
  createdAt: Date;
}

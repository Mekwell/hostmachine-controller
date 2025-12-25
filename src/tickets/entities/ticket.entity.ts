import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from '../../servers/entities/server.entity';
import { Node } from '../../nodes/entities/node.entity';

export enum TicketType {
  CRASH = 'CRASH',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  CONFIG_ERROR = 'CONFIG_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  INTEGRITY_FAILURE = 'INTEGRITY_FAILURE',
  UNKNOWN = 'UNKNOWN',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED', // Requires human intervention
  PENDING = 'PENDING',
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'simple-enum',
    enum: TicketType,
    default: TicketType.UNKNOWN,
  })
  type: TicketType;

  @Column({
    type: 'simple-enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column('text')
  logs: string; // The error logs or evidence

  @Column('text', { nullable: true })
  aiAnalysis: string; // What HostBot thinks happened

  @Column('text', { nullable: true })
  resolution: string; // What action was taken

  @ManyToOne(() => Server, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column({ nullable: true })
  serverId: string;

  @ManyToOne(() => Node, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'nodeId' })
  node: Node;

  @Column({ nullable: true })
  nodeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

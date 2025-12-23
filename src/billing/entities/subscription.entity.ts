import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Mock User ID for now

  @ManyToOne(() => Plan)
  plan!: Plan;

  @Column({ default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

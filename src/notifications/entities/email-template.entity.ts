import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity()
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'welcome', 'verify_email'

  @Column()
  subject: string;

  @Column('text')
  body: string; // HTML content

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  hostname!: string;

  @Column({ unique: true })
  apiKey!: string; // The secret key the agent uses to authenticate

  @Column({ default: 'GLOBAL' })
  location!: string;

  @Column({ default: 'ONLINE' })
  status!: string;

  // Storing complex specs as a simple JSON string for SQLite simplicity
  // In Postgres, we would use type: 'jsonb'
  @Column('simple-json')
  specs!: {
    cpuCores: number;
    totalMemoryMb: number;
    totalDiskGb: number;
    osPlatform: string;
  };

  @Column('simple-json', { nullable: true })
  usage?: {
    cpuLoad: number;
    memoryUsedMb: number;
    memoryFreeMb: number;
    diskUsedGb: number;
  };

  @Column({ nullable: true })
  vpnIp?: string;

  @Column({ nullable: true })
  publicIp?: string;

  @Column({ nullable: true })
  externalIp?: string; // Overrides publicIp for DNS (e.g. Vultr VPS IP)

  @Column({ nullable: true })
  lastSeen?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

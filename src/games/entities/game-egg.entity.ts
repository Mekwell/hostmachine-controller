import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class GameEgg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // e.g. 'ark-ascended', 'minecraft-java'

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'dockerImage' })
  dockerImage!: string; // e.g. 'ghcr.io/pterodactyl/games:wine'

  @Column({ name: 'startupCommand' })
  startupCommand!: string; // e.g. './ShooterGameServer ...'

  @Column({ default: 'linux' })
  os!: string; // 'linux' | 'windows'

  @Column({ default: 'game' })
  category!: string; // 'game' | 'voip' | 'web'

  @Column({ type: 'simple-json', nullable: true })
  environment!: {
    name: string;
    description: string;
    envVar: string;
    defaultValue: string;
    userViewable: boolean;
    userEditable: boolean;
    rules: string;
  }[];

  @Column({ type: 'text', nullable: true })
  installScript!: string; // Bash script for installation

  @Column({ type: 'text', nullable: true, name: 'installContainerImage' })
  installContainerImage!: string; // e.g. 'ghcr.io/pterodactyl/installers:debian'

  @Column({ type: 'text', nullable: true, name: 'installEntrypoint' })
  installEntrypoint!: string; // e.g. '/bin/bash'

  @Column({ nullable: true, name: 'configFile' })
  configFile!: string; // Relative path to main config file

  @Column({ default: 0, name: 'defaultPort' })
  defaultPort!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

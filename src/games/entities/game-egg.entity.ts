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
  docker_image!: string; 

  @Column({ name: 'startupCommand' })
  startup_command!: string; 

  @Column({ default: 'linux' })
  os!: string; 

  @Column({ default: 'game' })
  category!: string; 

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

  @Column({ type: 'text', nullable: true, name: 'installScript' })
  install_script!: string; 

  @Column({ type: 'text', nullable: true, name: 'installContainerImage' })
  install_container_image!: string; 

  @Column({ type: 'text', nullable: true, name: 'installEntrypoint' })
  install_entrypoint!: string; 

  @Column({ nullable: true, name: 'configFile' })
  config_file!: string; 

  @Column({ default: 0, name: 'defaultPort' })
  default_port!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

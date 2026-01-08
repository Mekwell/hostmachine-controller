import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEgg } from './entities/game-egg.entity';

export interface GameVariable {
  name: string;
  description: string;
  envVar: string;
  defaultValue: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  options?: string[]; 
}

export interface GameTemplate {
  id: string;
  name: string;
  type: string;
  category: 'game' | 'voip' | 'web' | 'utility';
  dockerImage: string;
  defaultPort: number;
  defaultEnv: string[];
  configFile?: string; // NEW: Path relative to /data
  icon: string;
  banner?: string;
  description: string;
  variables: GameVariable[];
  requiredOs: 'linux' | 'windows';
  installScript?: string;
  installContainerImage?: string;
  installEntrypoint?: string;
  startupCommand?: string;
}

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(GameEgg)
    private eggRepository: Repository<GameEgg>
  ) {}

  async findAll() {
    // 1. Fetch DB Eggs
    const eggs = await this.eggRepository.find();

    // 2. Map Eggs to GameTemplate format
    return eggs.map(egg => ({
      id: egg.code,
      name: egg.name,
      type: egg.code,
      category: egg.category as any,
      dockerImage: egg.docker_image,
      defaultPort: egg.default_port,
      defaultEnv: [],
      configFile: egg.config_file,
      icon: '🥚',
      banner: '/banners/ark.jpg',
      description: egg.description,
      requiredOs: egg.os as any,
      installScript: egg.install_script,
      installContainerImage: egg.install_container_image,
      installEntrypoint: egg.install_entrypoint,
      startupCommand: egg.startup_command,
      variables: (egg.environment || []).map(env => ({
        name: env.name,
        description: env.description,
        envVar: env.envVar,
        defaultValue: env.defaultValue,
        type: 'string' as any
      }))
    }));
  }

  async findOne(id: string) {
    const allGames = await this.findAll();
    return allGames.find(g => g.id === id);
  }

  async importEgg(json: any) {
    this.logger.log(`Importing Pterodactyl Egg: ${json.name}`);
    
    // Mapping Pterodactyl JSON to HostMachine Egg
    const egg = this.eggRepository.create({
      code: `egg-${json.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: json.name,
      description: json.description,
      docker_image: json.docker_images ? Object.values(json.docker_images)[0] as string : 'ghcr.io/pterodactyl/games:source',
      startup_command: json.startup,
      install_script: json.scripts?.installation?.script,
      install_container_image: json.scripts?.installation?.container,
      install_entrypoint: json.scripts?.installation?.entrypoint,
      category: 'game',
      os: 'linux',
      environment: json.variables?.map((v: any) => ({
        name: v.name,
        description: v.description,
        envVar: v.env_variable,
        defaultValue: v.default_value,
        userViewable: v.user_viewable,
        userEditable: v.user_editable,
        rules: v.rules
      })) || []
    });

    return this.eggRepository.save(egg);
  }
}

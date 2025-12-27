import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../servers/entities/server.entity';
import axios from 'axios';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class ModsService {
  private readonly logger = new Logger(ModsService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private commandsService: CommandsService,
  ) {}

  async installMod(serverId: string, modId: string) {
    const server = await this.serverRepository.findOne({ 
        where: { id: serverId },
        relations: ['node'] 
    });
    if (!server) throw new Error('Server not found');

    this.logger.log(`Installing mod ${modId} on server ${serverId}`);

    // 1. Fetch project info from Modrinth
    const projectRes = await axios.get(`https://api.modrinth.com/v2/project/${modId}`);
    const project = projectRes.data;

    // 2. Find best version for this server
    let loader = 'forge';
    if (server.gameType.includes('fabric')) loader = 'fabric';
    else if (server.gameType.includes('forge')) loader = 'forge';
    else if (server.gameType.includes('java')) loader = 'paper';
    
    const versionsRes = await axios.get(`https://api.modrinth.com/v2/project/${modId}/version`, {
        params: {
            loaders: JSON.stringify([loader]),
        }
    });

    let version = versionsRes.data[0]; 
    
    // Fallback: If no 'paper' version, try 'spigot' or 'bukkit' for minecraft-java
    if (!version && loader === 'paper') {
        const fallbackRes = await axios.get(`https://api.modrinth.com/v2/project/${modId}/version`, {
            params: { loaders: JSON.stringify(['spigot', 'bukkit']) }
        });
        version = fallbackRes.data[0];
    }

    if (!version) throw new Error(`No compatible versions found for loader: ${loader}`);

    const primaryFile = version.files.find((f: any) => f.primary) || version.files[0];
    const downloadUrl = primaryFile.url;
    const filename = primaryFile.filename;

    // 3. Command Agent to download
    // Path is relative to server data dir. Minecraft mods go in /mods
    const installPath = `/mods/${filename}`;
    
    await this.commandsService.executeCommand(serverId, `curl -L -o ${installPath} ${downloadUrl}`);

    // 4. Update managed mods in DB
    const currentMods = server.managedMods || [];
    if (!currentMods.find(m => m.id === modId)) {
        currentMods.push({
            id: modId,
            name: project.title,
            version: version.version_number,
            filename: filename,
            loader: loader
        });
        await this.serverRepository.update(serverId, { managedMods: currentMods });
    }

    return { status: 'installing', filename };
  }

  async uninstallMod(serverId: string, modId: string) {
      const server = await this.serverRepository.findOneBy({ id: serverId });
      if (!server || !server.managedMods) return;

      const mod = server.managedMods.find(m => m.id === modId);
      if (mod) {
          await this.commandsService.executeCommand(serverId, `rm /mods/${mod.filename}`);
          const remaining = server.managedMods.filter(m => m.id !== modId);
          await this.serverRepository.update(serverId, { managedMods: remaining });
      }
      return { status: 'uninstalled' };
  }

  resolveDependencies(mods: any[]) {
      // TODO: Implement actual dependency resolution via Modrinth API
      // For now, just return the requested mods as-is
      return mods;
  }

  async getInstalledMods(serverId: string) {
      const server = await this.serverRepository.findOneBy({ id: serverId });
      return server?.managedMods || [];
  }
}
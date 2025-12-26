import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../servers/entities/server.entity';
import { CommandsService } from '../commands/commands.service';
import { CommandType } from '../commands/dto/create-command.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private commandsService: CommandsService
  ) {}

  async listFiles(serverId: string, path: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.LIST_FILES,
        payload: { serverId, path }
    });

    return this.commandsService.waitForResult(cmd.id);
  }

  async getFileContent(serverId: string, path: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.GET_FILE,
        payload: { serverId, path }
    });

    return this.commandsService.waitForResult(cmd.id);
  }

  async writeFileContent(serverId: string, path: string, content: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.WRITE_FILE,
        payload: { serverId, path, content }
    });

    return this.commandsService.waitForResult(cmd.id);
  }

  async getLogs(serverId: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.GET_LOGS,
        payload: { serverId }
    });

    return this.commandsService.waitForResult(cmd.id);
  }

  async deleteFile(serverId: string, path: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.DELETE_FILE,
        payload: { serverId, path }
    });

    return this.commandsService.waitForResult(cmd.id);
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommandDto, AgentCommandResponse, CommandType } from './dto/create-command.dto';
import { Server } from '../servers/entities/server.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CommandQueueItem {
  id: string;
  targetNodeId: string;
  type: CommandType;
  payload: any;
  status: 'PENDING' | 'PICKED_UP' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);
  
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  private queue: CommandQueueItem[] = [];
  private results: Record<string, any> = {};
  private logCache: Record<string, string> = {}; 

  create(createCommandDto: CreateCommandDto) {
    const command: CommandQueueItem = {
      id: uuidv4(),
      targetNodeId: createCommandDto.targetNodeId,
      type: createCommandDto.type,
      payload: createCommandDto.payload,
      status: 'PENDING',
      createdAt: new Date(),
    };
    
    this.queue.push(command);
    this.logger.log(`Command Queued: ${command.type} for Node ${command.targetNodeId}`);
    return { id: command.id, status: 'queued' };
  }

  getNextPendingCommand(nodeId: string): AgentCommandResponse | null {
    const command = this.queue.find(
      c => c.targetNodeId === nodeId && c.status === 'PENDING'
    );

    if (!command) return null;

    command.status = 'PICKED_UP';
    this.logger.log(`Node ${nodeId} picked up command ${command.id}`);

    return {
      id: command.id,
      type: command.type,
      payload: command.payload,
      createdAt: command.createdAt
    };
  }

  complete(commandId: string, success: boolean, result?: any) {
    const command = this.queue.find(c => c.id === commandId);
    if (!command) throw new NotFoundException('Command not found');

    command.status = success ? 'COMPLETED' : 'FAILED';
    if (result) {
        this.results[commandId] = result;
        if (command.type === CommandType.GET_LOGS && result.logs) {
            this.logCache[command.payload.serverId] = result.logs;
        }
    }
    this.logger.log(`Command ${commandId} ${success ? 'Completed' : 'Failed'}`);
    return { status: 'acknowledged' };
  }

  async getLogs(serverId: string) {
      const cached = this.logCache[serverId] || 'Initializing console...';
      const server = await this.serverRepository.findOneBy({ id: serverId });
      if (server) {
          this.create({
              targetNodeId: server.nodeId,
              type: CommandType.GET_LOGS,
              payload: { serverId }
          });
      }
      return { logs: cached };
  }

  async executeCommand(serverId: string, command: string) {
    const server = await this.serverRepository.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException('Server not found');

    const cmd = this.create({
        targetNodeId: server.nodeId,
        type: CommandType.EXEC_COMMAND,
        payload: { serverId, command }
    });

    return this.waitForResult(cmd.id);
  }

  async waitForResult(commandId: string, timeoutMs: number = 60000): Promise<any> {
      return new Promise((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
              attempts++;
              const cmd = this.queue.find(c => c.id === commandId);
              if (!cmd) { clearInterval(interval); reject(new Error('Command lost')); return; }

              if (cmd.status === 'COMPLETED') {
                  clearInterval(interval);
                  resolve(this.results[commandId]);
              } else if (cmd.status === 'FAILED') {
                  clearInterval(interval);
                  reject(new Error('Agent failed task'));
              } else if (attempts * 1000 > timeoutMs) {
                  clearInterval(interval);
                  reject(new Error('Timeout waiting for agent'));
              }
          }, 1000);
      });
  }
}

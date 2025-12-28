import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Server } from './entities/server.entity';
import { CommandsService } from '../commands/commands.service';
import { CommandType } from '../commands/dto/create-command.dto';

@Injectable()
export class HibernationService {
  private readonly logger = new Logger(HibernationService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private commandsService: CommandsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkForInactivity() {
    this.logger.log('Running auto-hibernation audit...');
    
    // Find servers that are LIVE, have 0 players, and last activity > 30 mins ago
    const inactivityLimit = new Date(Date.now() - 30 * 60 * 1000);
    
    const candidates = await this.serverRepository.find({
        where: {
            status: 'LIVE',
            playerCount: 0,
            hibernationEnabled: true,
            lastPlayerActivity: LessThan(inactivityLimit)
        },
        relations: ['node']
    });

    if (candidates.length === 0) return;

    this.logger.log(`Found ${candidates.length} hibernation candidates.`);

    for (const server of candidates) {
        this.logger.log(`Hibernating server ${server.name} (${server.id}) due to inactivity.`);
        
        await this.commandsService.create({
            targetNodeId: server.nodeId,
            type: CommandType.STOP_SERVER,
            payload: { containerId: server.id }
        });

        await this.serverRepository.update(server.id, { 
            status: 'SLEEPING' 
        });
    }
  }
}

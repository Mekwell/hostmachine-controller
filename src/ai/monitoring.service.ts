import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Server } from '../servers/entities/server.entity';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async resourceCheck() {
    this.logger.log('HostBot performing resource audit...');
    
    // Check for RAM usage > 90%
    const servers = await this.serverRepository.find({
        where: { status: 'LIVE' }
    });

    for (const server of servers) {
        // Assuming ramUsage is in MB and memoryLimitMb is the total
        const percentage = (server.ramUsage / server.memoryLimitMb) * 100;
        
        if (percentage > 90) {
            this.logger.warn(`Server ${server.name} is at ${percentage.toFixed(1)}% RAM. Alerting user.`);
            
            await this.notificationService.sendAlert(
                'RESOURCE CRITICAL', 
                `Your server ${server.name} is using ${percentage.toFixed(1)}% of its allocated RAM. A restart is recommended to prevent crashing.`,
                'WARNING'
            );
        }
    }
  }
}

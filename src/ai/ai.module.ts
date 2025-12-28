import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MonitoringService } from './monitoring.service';
import { Server } from '../servers/entities/server.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { CommandsModule } from '../commands/commands.module';
import { ServersModule } from '../servers/servers.module';
import { NotificationModule } from '../notifications/notification.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Ticket]),
    TicketsModule,
    CommandsModule,
    forwardRef(() => ServersModule),
    NotificationModule,
    RedisModule,
  ],
  controllers: [AiController],
  providers: [AiService, MonitoringService],
})
export class AiModule {}
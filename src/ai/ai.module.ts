import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MonitoringService } from './monitoring.service';

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

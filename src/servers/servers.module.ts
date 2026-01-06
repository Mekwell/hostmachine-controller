import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entities/server.entity';
import { Metric } from './entities/metric.entity';
import { NodesModule } from '../nodes/nodes.module';
import { CommandsModule } from '../commands/commands.module';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { ModsModule } from '../mods/mods.module';
import { DnsModule } from '../dns/dns.module';
import { BullModule } from '@nestjs/bullmq';
import { HibernationService } from './hibernation.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { Schedule } from './entities/schedule.entity';
import { NetdataService } from './services/netdata.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Metric, Schedule]),
    ScheduleModule.forRoot(),
    forwardRef(() => NodesModule),
    CommandsModule,
    forwardRef(() => AuthModule),
    GamesModule,
    ModsModule,
    DnsModule,
    BullModule.registerQueue({ name: 'deploy' })
  ],
  controllers: [ServersController],
  providers: [ServersService, HibernationService, ScheduleService, NetdataService],
  exports: [ServersService]
})
export class ServersModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entities/server.entity';
import { Metric } from './entities/metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Metric]),
    forwardRef(() => NodesModule),
    CommandsModule,
    forwardRef(() => AuthModule),
    GamesModule,
    ModsModule,
    DnsModule,
    BullModule.registerQueue({ name: 'deploy' })
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService]
})
export class ServersModule {}

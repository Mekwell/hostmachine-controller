import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entities/server.entity';
import { NodesModule } from '../nodes/nodes.module';
import { CommandsModule } from '../commands/commands.module';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { ModsModule } from '../mods/mods.module';
import { DnsModule } from '../dns/dns.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    forwardRef(() => NodesModule),
    CommandsModule,
    forwardRef(() => AuthModule),
    GamesModule,
    ModsModule,
    DnsModule
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService]
})
export class ServersModule {}

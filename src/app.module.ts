import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NodesModule } from './nodes/nodes.module';
import { ServersModule } from './servers/servers.module';
import { BillingModule } from './billing/billing.module';
import { AuthModule } from './auth/auth.module';
import { CommandsModule } from './commands/commands.module';
import { PlansModule } from './plans/plans.module';
import { GamesModule } from './games/games.module';
import { Node } from './nodes/entities/node.entity';
import { Plan } from './plans/entities/plan.entity';
import { BackupsModule } from './backups/backups.module';
import { Server } from './servers/entities/server.entity';
import { Backup } from './backups/entities/backup.entity';
import { Subscription } from './billing/entities/subscription.entity';

import { FilesModule } from './files/files.module';
import { ModsModule } from './mods/mods.module';
import { DnsModule } from './dns/dns.module';
import { ConfigParserModule } from './config-parser/config-parser.module';
import { QueueModule } from './queue/queue.module';
import { TicketsModule } from './tickets/tickets.module';
import { AiModule } from './ai/ai.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { ConsoleModule } from './console/console.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'hostmachine.sqlite',
      entities: [Node, Plan, Subscription, Server, Backup, Ticket],
      synchronize: true, // WARNING: Only for Development! Auto-updates DB schema.
    }),
    TypeOrmModule.forFeature([Node, Plan]),
    NodesModule,
    ServersModule,
    BillingModule,
    AuthModule,
    CommandsModule,
    PlansModule,
    GamesModule,
    BackupsModule,
    FilesModule,
    ModsModule,
    DnsModule,
    QueueModule,
    ConfigParserModule,
    TicketsModule,
    AiModule,
    ConsoleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
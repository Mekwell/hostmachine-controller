import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [TicketsModule, CommandsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}

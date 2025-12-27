import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModsService } from './mods.service';
import { ModsController } from './mods.controller';
import { Server } from '../servers/entities/server.entity';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    CommandsModule
  ],
  controllers: [ModsController],
  providers: [ModsService],
})
export class ModsModule {}
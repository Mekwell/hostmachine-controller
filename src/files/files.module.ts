import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CommandsModule } from '../commands/commands.module';
import { Server } from '../servers/entities/server.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    CommandsModule
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}

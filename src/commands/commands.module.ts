import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandsService } from './commands.service';
import { CommandsController } from './commands.controller';
import { AuthModule } from '../auth/auth.module';
import { NodesModule } from '../nodes/nodes.module';
import { Server } from '../servers/entities/server.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    AuthModule,
    forwardRef(() => NodesModule)
  ],
  controllers: [CommandsController],
  providers: [CommandsService],
  exports: [CommandsService]
})
export class CommandsModule {}
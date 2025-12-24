import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Node } from '../nodes/entities/node.entity';
import { Server } from '../servers/entities/server.entity';
import { Subscription } from '../billing/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Node, Server, Subscription])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

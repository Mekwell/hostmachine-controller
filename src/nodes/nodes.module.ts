import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { Node } from './entities/node.entity';
import { AuthModule } from '../auth/auth.module';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Node]),
    forwardRef(() => AuthModule),
    forwardRef(() => ServersModule)
  ],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService]
})
export class NodesModule {}
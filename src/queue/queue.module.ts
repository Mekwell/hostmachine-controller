import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DeploymentProcessor } from './processors/deployment.processor';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'deploy',
    }),
    ServersModule,
  ],
  providers: [DeploymentProcessor],
  exports: [BullModule],
})
export class QueueModule {}

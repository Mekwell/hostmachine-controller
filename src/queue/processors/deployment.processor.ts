import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ServersService } from '../../servers/servers.service';
import { Logger } from '@nestjs/common';

@Processor('deploy')
export class DeploymentProcessor extends WorkerHost {
  private readonly logger = new Logger(DeploymentProcessor.name);

  constructor(private readonly serversService: ServersService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing Deployment Job ${job.id}: ${job.data.serverName} (${job.data.gameType})`);
    
    try {
        // Execute the actual deployment logic
        const result = await this.serversService.deployServerTask(job.data, job);
        this.logger.log(`Deployment Job ${job.id} Completed: ${result.serverId}`);
        return result;
    } catch (error: any) {
        this.logger.error(`Deployment Job ${job.id} Failed: ${error.message}`);
        throw error;
    }
  }
}

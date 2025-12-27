import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import Redis from 'ioredis';
import { ConsoleGateway } from './console.gateway';

@Injectable()
export class ConsoleService implements OnModuleInit {
  private redis: Redis;
  private readonly logger = new Logger(ConsoleService.name);

  constructor(
    @Inject(forwardRef(() => ConsoleGateway))
    private gateway: ConsoleGateway
  ) {}

  onModuleInit() {
    this.redis = new Redis({
        host: '127.0.0.1',
        port: 6379,
    });

    this.redis.psubscribe('logs:*', 'stats:*', (err, count) => {
        if (err) this.logger.error('Failed to subscribe to Redis channels', err);
        else this.logger.log(`Subscribed to ${count} Redis log/stats channels.`);
    });

    this.redis.on('pmessage', async (pattern, channel, message) => {
        const [type, serverId] = channel.split(':');
        if (serverId) {
            if (type === 'logs') {
                // Buffer logs in Redis (List)
                const bufferKey = `log_buffer:${serverId}`;
                await this.redis.lpush(bufferKey, message);
                await this.redis.ltrim(bufferKey, 0, 499); // Keep last 500 lines

                this.gateway.server.to(`server:${serverId}`).emit('log', message);
            } else if (type === 'stats') {
                try {
                    const stats = JSON.parse(message);
                    this.gateway.server.to(`server:${serverId}`).emit('stats', stats);
                } catch (e) {}
            }
        }
    });
  }

  async getLogs(serverId: string): Promise<string[]> {
    const bufferKey = `log_buffer:${serverId}`;
    const logs = await this.redis.lrange(bufferKey, 0, -1);
    return logs.reverse(); // Reverse to get chronological order
  }
}

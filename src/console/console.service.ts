import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import Redis from 'ioredis';
import { ConsoleGateway } from './console.gateway';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class ConsoleService implements OnModuleInit {
  private subClient: Redis;
  private readonly logger = new Logger(ConsoleService.name);

  constructor(
    @Inject(forwardRef(() => ConsoleGateway))
    private gateway: ConsoleGateway,
    private redisService: RedisService,
  ) {}

  onModuleInit() {
    this.subClient = new Redis({
        host: '127.0.0.1',
        port: 6379,
    });

    this.subClient.psubscribe('logs:*', 'stats:*', (err, count) => {
        if (err) this.logger.error('Failed to subscribe to Redis channels', err);
        else this.logger.log(`Subscribed to ${count} Redis log/stats channels.`);
    });

    this.subClient.on('pmessage', async (pattern, channel, message) => {
        const [type, serverId] = channel.split(':');
        if (serverId) {
            if (type === 'logs') {
                // Buffer logs in Redis (List) - Use standard client for commands
                const bufferKey = `log_buffer:${serverId}`;
                await this.redisService.client.lpush(bufferKey, message);
                await this.redisService.client.ltrim(bufferKey, 0, 499); // Keep last 500 lines

                if (this.gateway.server) {
                    this.gateway.server.to(`server:${serverId}`).emit('log', message);
                }
            } else if (type === 'stats') {
                try {
                    const stats = JSON.parse(message);
                    if (this.gateway.server) {
                        this.gateway.server.to(`server:${serverId}`).emit('stats', stats);
                    }
                } catch (e) {}
            }
        }
    });
  }

  async getLogs(serverId: string): Promise<string[]> {
    const bufferKey = `log_buffer:${serverId}`;
    const logs = await this.redisService.client.lrange(bufferKey, 0, -1);
    return logs.reverse(); // Reverse to get chronological order
  }
}

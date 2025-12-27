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
    // Create a DEDICATED client for subscribing to avoid subscriber-mode command errors
    this.subClient = new Redis({
        host: '127.0.0.1',
        port: 6379,
    });

    this.subClient.on('error', (err) => {
        this.logger.error('Redis Subscription Client Error:', err.message);
    });

    this.subClient.psubscribe('logs:*', 'stats:*', (err, count) => {
        if (err) this.logger.error('Failed to subscribe to Redis channels', err);
        else this.logger.log(`Subscribed to ${count} Redis log/stats channels.`);
    });

    this.subClient.on('pmessage', async (pattern, channel, message) => {
        const [type, serverId] = channel.split(':');
        if (serverId) {
            if (type === 'logs') {
                // Buffer logs in Redis using the STANDARD client from RedisService
                const bufferKey = `log_buffer:${serverId}`;
                try {
                    await this.redisService.client.lpush(bufferKey, message);
                    await this.redisService.client.ltrim(bufferKey, 0, 499);
                } catch (e) {
                    this.logger.error(`Failed to buffer log for ${serverId}: ${e.message}`);
                }

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
    // Use standard client for querying
    const bufferKey = `log_buffer:${serverId}`;
    const logs = await this.redisService.client.lrange(bufferKey, 0, -1);
    return logs.reverse();
  }
}
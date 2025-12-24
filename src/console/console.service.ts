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
        host: 'localhost',
        port: 6379,
    });

    this.redis.psubscribe('logs:*', (err, count) => {
        if (err) this.logger.error('Failed to subscribe to Redis logs', err);
        else this.logger.log(`Subscribed to ${count} Redis log channels.`);
    });

    this.redis.on('pmessage', (pattern, channel, message) => {
        // channel = "logs:<server_id>"
        const serverId = channel.split(':')[1];
        if (serverId) {
            // Emit to WebSocket Room
            this.gateway.server.to(`server:${serverId}`).emit('log', message);
        }
    });
  }
}

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Error:', err.message);
    });
  }

  async publish(channel: string, message: string) {
    return this.client.publish(channel, message);
  }

  onModuleDestroy() {
    this.client.quit();
  }
}

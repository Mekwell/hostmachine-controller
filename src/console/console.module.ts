import { Module, forwardRef } from '@nestjs/common';
import { ConsoleGateway } from './console.gateway';
import { ConsoleService } from './console.service';

import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ConsoleGateway, ConsoleService],
  exports: [ConsoleGateway, ConsoleService],
})
export class ConsoleModule {}

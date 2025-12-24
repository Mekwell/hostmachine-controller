import { Module, forwardRef } from '@nestjs/common';
import { ConsoleGateway } from './console.gateway';
import { ConsoleService } from './console.service';

@Module({
  providers: [ConsoleGateway, ConsoleService],
  exports: [ConsoleGateway, ConsoleService],
})
export class ConsoleModule {}

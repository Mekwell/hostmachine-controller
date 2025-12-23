import { Module } from '@nestjs/common';
import { InternalGuard } from './internal.guard';
import { ApiKeyGuard } from './api-key.guard';
import { NodesModule } from '../nodes/nodes.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => NodesModule)],
  providers: [InternalGuard, ApiKeyGuard],
  exports: [InternalGuard, ApiKeyGuard],
})
export class AuthModule {}
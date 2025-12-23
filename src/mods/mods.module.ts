import { Module, forwardRef } from '@nestjs/common';
import { ModsService } from './mods.service';
import { ModsController } from './mods.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ModsController],
  providers: [ModsService],
  exports: [ModsService]
})
export class ModsModule {}

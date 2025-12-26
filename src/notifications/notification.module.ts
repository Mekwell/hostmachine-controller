import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { EmailTemplate } from './entities/email-template.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

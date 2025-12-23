import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';
import { Backup } from './entities/backup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Backup])],
  controllers: [BackupsController],
  providers: [BackupsService],
})
export class BackupsModule {}

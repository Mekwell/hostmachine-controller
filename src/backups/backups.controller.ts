import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('backups')
@UseGuards(InternalGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get(':serverId')
  findAll(@Param('serverId') serverId: string) {
    return this.backupsService.findAll(serverId);
  }

  @Post(':serverId')
  create(@Param('serverId') serverId: string) {
    return this.backupsService.create(serverId);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.backupsService.restore(id);
  }
}

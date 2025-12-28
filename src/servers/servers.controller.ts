import { Body, Controller, Post, UseGuards, Get, Param, Delete, Query, Patch } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ScheduleService } from './schedule.service';
import { CreateServerDto } from './dto/create-server.dto';
import { InternalGuard } from '../auth/internal.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { OrGuard } from '../auth/or.guard';

@Controller('servers')
@UseGuards(OrGuard(InternalGuard, ApiKeyGuard))
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly scheduleService: ScheduleService
  ) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.serversService.findAll(userId);
  }

  @Get(':id/schedules')
  getSchedules(@Param('id') id: string) {
    // Note: I need to ensure this method exists in ScheduleService or query here.
    // For now, I'll add a findAllForServer method to ScheduleService next.
    return (this.scheduleService as any).findAllForServer(id);
  }

  @Post(':id/schedules')
  createSchedule(@Param('id') id: string, @Body() dto: any) {
    return this.scheduleService.create({ ...dto, serverId: id });
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string) {
    return this.scheduleService.delete(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
  }

  @Get(':id/metrics')
  getMetrics(@Param('id') id: string) {
    return this.serversService.getMetrics(id);
  }

  @Post()
  create(@Body() createServerDto: CreateServerDto) {
    return this.serversService.deployServer(createServerDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateServerDto>) {
    return this.serversService.update(id, updateDto);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.serversService.setServerStatus(id, 'start');
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    return this.serversService.setServerStatus(id, 'stop');
  }

  @Post(':id/restart')
  restart(@Param('id') id: string) {
    return this.serversService.setServerStatus(id, 'restart');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serversService.delete(id);
  }
}
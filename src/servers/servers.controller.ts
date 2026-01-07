import { Body, Controller, Post, UseGuards, Get, Param, Delete, Query, Patch, NotFoundException, BadRequestException } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ScheduleService } from './schedule.service';
import { NetdataService } from './services/netdata.service';
import { CreateServerDto } from './dto/create-server.dto';
import { InternalGuard } from '../auth/internal.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { OrGuard } from '../auth/or.guard';

@Controller('servers')
@UseGuards(OrGuard(InternalGuard, ApiKeyGuard))
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly scheduleService: ScheduleService,
    private readonly netdataService: NetdataService
  ) {}

  @Get('lookup')
  async lookup(@Query('hostname') hostname: string) {
    // Logic to find server by subdomain
    // Assuming hostmachine.com.au domain
    const cleanSubdomain = hostname.replace('.hostmachine.com.au', '');
    return this.serversService.findBySubdomain(cleanSubdomain);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.serversService.findAll(userId);
  }

  @Get(':id/metrics/live')
  async getLiveMetrics(@Param('id') id: string) {
    const server = await this.serversService.findOne(id);
    if (!server || !server.node) throw new NotFoundException('Server or Node not found');
    
    const nodeIp = server.node.vpnIp || server.node.publicIp;
    if (!nodeIp) throw new BadRequestException('Node has no reachable IP');

    return this.netdataService.getContainerStats(nodeIp, id);
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
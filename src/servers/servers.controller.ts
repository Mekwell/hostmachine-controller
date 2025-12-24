import { Body, Controller, Post, UseGuards, Get, Param, Delete, Query } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { InternalGuard } from '../auth/internal.guard';

import { Body, Controller, Post, UseGuards, Get, Param, Delete, Query, Patch } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { InternalGuard } from '../auth/internal.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { OrGuard } from '../auth/or.guard';

@Controller('servers')
@UseGuards(OrGuard(InternalGuard, ApiKeyGuard))
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.serversService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
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

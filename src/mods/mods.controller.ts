import { Controller, Get, Post, Body, Query, Param, Delete } from '@nestjs/common';
import { ModsService } from './mods.service';

@Controller('mods')
export class ModsController {
  constructor(private readonly modsService: ModsService) {}

  @Get(':serverId')
  async getInstalled(@Param('serverId') serverId: string) {
    return this.modsService.getInstalledMods(serverId);
  }

  @Post(':serverId/install')
  async install(@Param('serverId') serverId: string, @Body('modId') modId: string) {
    return this.modsService.installMod(serverId, modId);
  }

  @Delete(':serverId/:modId')
  async uninstall(@Param('serverId') serverId: string, @Param('modId') modId: string) {
    return this.modsService.uninstallMod(serverId, modId);
  }
}
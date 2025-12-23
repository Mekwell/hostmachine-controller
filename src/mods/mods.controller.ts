import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ModsService } from './mods.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('mods')
@UseGuards(InternalGuard)
export class ModsController {
  constructor(private readonly modsService: ModsService) {}

  @Get()
  findAll(@Query('game') gameType?: string) {
    return this.modsService.findAll(gameType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modsService.findOne(id);
  }
}

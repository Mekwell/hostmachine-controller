import { Controller, Get, Param, UseGuards, Delete, Body, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('tickets')
@UseGuards(InternalGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
      return this.ticketsService.resolve(id, resolution);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

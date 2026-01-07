import { Controller, Get, UseGuards } from '@nestjs/common';
import { GamesService, GameTemplate } from './games.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('games')
@UseGuards(InternalGuard)
export class GamesController {
  private cache: GameTemplate[] | null = null;

  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async findAll() {
    if (this.cache) return this.cache;
    this.cache = await this.gamesService.findAll();
    return this.cache;
  }
}

import { Controller, Get } from '@nestjs/common';
import { GamesService } from './games.service';
import { InternalGuard } from '../auth/internal.guard';
import { UseGuards } from '@nestjs/common';

@Controller('games')
@UseGuards(InternalGuard)
export class GamesController {
  private cache: any[] | null = null;

  constructor(private readonly gamesService: GamesService) {}

  @Get()
  findAll() {
    if (this.cache) return this.cache;
    this.cache = this.gamesService.findAll();
    return this.cache;
  }
}

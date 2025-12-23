import { Controller, Get, Post, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { CommandsService } from '../commands/commands.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('files')
@UseGuards(InternalGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly commandsService: CommandsService
  ) {}

  @Get('list')
  async listFiles(@Query('serverId') serverId: string, @Query('path') path: string = '/') {
    return this.filesService.listFiles(serverId, path);
  }

  @Get('read')
  async getFileContent(@Query('serverId') serverId: string, @Query('path') path: string) {
    return this.filesService.getFileContent(serverId, path);
  }

  @Get('logs')
  getLogs(@Query('serverId') serverId: string) {
    return this.commandsService.getLogs(serverId);
  }

  @Post('write')
  async writeFileContent(@Body() dto: { serverId: string, path: string, content: string }) {
    return this.filesService.writeFileContent(dto.serverId, dto.path, dto.content);
  }
}
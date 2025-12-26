import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('files')
@UseGuards(InternalGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('list')
  listFiles(@Query('serverId') serverId: string, @Query('path') path: string) {
    return this.filesService.listFiles(serverId, path || '/');
  }

  @Get('read')
  readFile(@Query('serverId') serverId: string, @Query('path') path: string) {
    return this.filesService.getFileContent(serverId, path);
  }

  @Get('logs')
  getLogs(@Query('serverId') serverId: string) {
    return this.filesService.getLogs(serverId);
  }

  @Post('write')
  writeFile(@Body() body: { serverId: string; path: string; content: string }) {
    return this.filesService.writeFileContent(body.serverId, body.path, body.content);
  }

  @Post('delete')
  deleteFile(@Body() body: { serverId: string; path: string }) {
    return this.filesService.deleteFile(body.serverId, body.path);
  }
}
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigParserService } from './config-parser.service';
import { FilesService } from '../files/files.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('config')
@UseGuards(InternalGuard)
export class ConfigParserController {
  constructor(
    private readonly configService: ConfigParserService,
    private readonly filesService: FilesService
  ) {}

  @Get(':serverId')
  async getConfig(@Param('serverId') serverId: string, @Query('file') file: string) {
      // 1. Read Raw File from Agent
      const response = await this.filesService.getFileContent(serverId, file);
      
      if (!response.content) return { config: {} };

      // 2. Parse based on extension
      const type = this.configService.detectType(file);
      let parsed = {};

      if (type === 'properties') parsed = this.configService.parseProperties(response.content);
      else if (type === 'ini') parsed = this.configService.parseIni(response.content);
      else if (type === 'json') parsed = JSON.parse(response.content);

      return { type, config: parsed };
  }

  @Post(':serverId')
  async saveConfig(
      @Param('serverId') serverId: string, 
      @Query('file') file: string,
      @Body() data: any
  ) {
      const type = this.configService.detectType(file);
      let content = '';

      if (type === 'properties') content = this.configService.stringifyProperties(data);
      else if (type === 'ini') content = this.configService.stringifyIni(data);
      else if (type === 'json') content = JSON.stringify(data, null, 2);

      return this.filesService.writeFileContent(serverId, file, content);
  }
}

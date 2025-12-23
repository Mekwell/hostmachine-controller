import { Module } from '@nestjs/common';
import { ConfigParserService } from './config-parser.service';
import { ConfigParserController } from './config-parser.controller';
import { FilesModule } from '../files/files.module'; // To read files
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [FilesModule, ServersModule],
  controllers: [ConfigParserController],
  providers: [ConfigParserService],
  exports: [ConfigParserService]
})
export class ConfigParserModule {}

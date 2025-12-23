import { Injectable } from '@nestjs/common';
import * as ini from 'ini';

@Injectable()
export class ConfigParserService {
  
  parseProperties(content: string): Record<string, any> {
    const lines = content.split('\n');
    const result: Record<string, any> = {};
    for (const line of lines) {
        if (line.trim().startsWith('#') || !line.includes('=')) continue;
        const [key, ...rest] = line.split('=');
        const value = rest.join('=');
        
        if (value === 'true') result[key.trim()] = true;
        else if (value === 'false') result[key.trim()] = false;
        else if (!isNaN(Number(value)) && value.trim() !== '') result[key.trim()] = Number(value);
        else result[key.trim()] = value.trim();
    }
    return result;
  }

  stringifyProperties(config: Record<string, any>): string {
      return Object.entries(config).map(([k, v]) => `${k}=${v}`).join('\n');
  }

  parseIni(content: string): Record<string, any> {
      return ini.parse(content);
  }

  stringifyIni(config: Record<string, any>): string {
      return ini.stringify(config);
  }

  detectType(filename: string): 'properties' | 'ini' | 'json' | 'unknown' {
      if (filename.endsWith('.properties')) return 'properties';
      if (filename.endsWith('.ini')) return 'ini';
      if (filename.endsWith('.json')) return 'json';
      return 'unknown';
  }
}

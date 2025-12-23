import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Backup } from './entities/backup.entity';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class BackupsService {
  constructor(
    @InjectRepository(Backup)
    private backupsRepository: Repository<Backup>,
    // In a real app we'd inject ServersService or CommandsService to trigger the actual backup
  ) {}

  async findAll(serverId: string) {
    return this.backupsRepository.find({
        where: { serverId },
        order: { createdAt: 'DESC' }
    });
  }

  async create(serverId: string) {
    // Mock: Create a backup record
    const backup = this.backupsRepository.create({
        serverId,
        name: `Backup-${new Date().toISOString()}`,
        sizeBytes: Math.floor(Math.random() * 1024 * 1024 * 500), // Random size up to 500MB
        status: 'COMPLETED'
    });
    
    return this.backupsRepository.save(backup);
  }

  async restore(id: string) {
    const backup = await this.backupsRepository.findOneBy({ id });
    if (!backup) throw new NotFoundException('Backup not found');
    
    // Mock: Trigger restore logic
    return { status: 'restoring', message: `Restoring from ${backup.name}` };
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ServersService } from './servers.service';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private schedulerRegistry: SchedulerRegistry,
    private serversService: ServersService,
    private commandsService: CommandsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing dynamic task scheduler...');
    await this.loadAllSchedules();
  }

  async loadAllSchedules() {
    const schedules = await this.scheduleRepository.find({ where: { active: true } });
    this.logger.log(`Found ${schedules.length} active schedules. Registering...`);
    
    for (const schedule of schedules) {
        this.addCronJob(schedule);
    }
  }

  async findAllForServer(serverId: string) {
      return this.scheduleRepository.find({ where: { serverId } });
  }

  addCronJob(schedule: Schedule) {
    const job = new CronJob(schedule.cronExpression, async () => {
        this.logger.log(`Executing scheduled task: ${schedule.name} for Server ${schedule.serverId}`);
        try {
            await this.executeTask(schedule);
            await this.scheduleRepository.update(schedule.id, { lastRun: new Date() });
        } catch (err: any) {
            this.logger.error(`Failed to execute scheduled task ${schedule.id}: ${err.message}`);
        }
    });

    this.schedulerRegistry.addCronJob(`server_task_${schedule.id}`, job);
    job.start();
  }

  async executeTask(schedule: Schedule) {
      switch (schedule.task) {
          case 'restart':
              await this.serversService.setServerStatus(schedule.serverId, 'restart');
              break;
          case 'backup':
              // Logic for creating backup via BackupsService (if exists)
              break;
          case 'command':
              if (schedule.payload) {
                  await this.commandsService.executeCommand(schedule.serverId, schedule.payload);
              }
              break;
      }
  }

  async create(dto: any) {
      const schedule = this.scheduleRepository.create(dto);
      const saved = await this.scheduleRepository.save(schedule);
      this.addCronJob(saved);
      return saved;
  }

  async delete(id: string) {
      this.schedulerRegistry.deleteCronJob(`server_task_${id}`);
      await this.scheduleRepository.delete(id);
  }
}

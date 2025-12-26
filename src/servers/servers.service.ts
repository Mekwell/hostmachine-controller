import { Injectable, Logger, ServiceUnavailableException, BadRequestException, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateServerDto } from './dto/create-server.dto';
import { NodesService } from '../nodes/nodes.service';
import { CommandsService } from '../commands/commands.service';
import { CommandType } from '../commands/dto/create-command.dto';
import { GamesService } from '../games/games.service';
import { ModsService } from '../mods/mods.service';
import { DnsService } from '../dns/dns.service';
import { Server } from './entities/server.entity';
import { Metric } from './entities/metric.entity';
import { nanoid } from 'nanoid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    @Inject(forwardRef(() => NodesService))
    private nodesService: NodesService,
    private commandsService: CommandsService,
    private gamesService: GamesService,
    private modsService: ModsService,
    private dnsService: DnsService,
    @InjectQueue('deploy') private deployQueue: Queue
  ) {}

  async findAll(userId?: string) {
    if (userId) {
      return this.serverRepository.find({ 
        where: { userId },
        relations: ['node'],
        order: { createdAt: 'DESC' } 
      });
    }
    return this.serverRepository.find({ 
        relations: ['node'],
        order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: string) {
    return this.serverRepository.findOne({ 
        where: { id },
        relations: ['node']
    });
  }

  /**
   * Updates server status based on active container list from node heartbeat.
   */
  async updateStatusFromHeartbeat(usage: any) {
      const containerStates = usage.containerStates || {};
      const runningIds = Object.keys(containerStates).filter(id => id !== 'none' && id.length > 5);
      
      this.logger.log(`Processing heartbeat for ${runningIds.length} containers...`);

      // 1. Mark missing servers as OFFLINE (Only those not already offline/stopped)
      await this.serverRepository.createQueryBuilder()
          .update()
          .set({ status: 'OFFLINE', playerCount: 0, cpuUsage: 0, ramUsage: 0 })
          .where("id NOT IN (:...ids)", { ids: runningIds.length > 0 ? runningIds : ['none'] })
          .andWhere("status NOT IN ('OFFLINE', 'STOPPED')")
          .execute();

      // 2. Efficiently update active containers
      if (runningIds.length === 0) return;

      // Fetch current state of all reported servers in one go
      const activeServers = await this.serverRepository.findBy({ id: In(runningIds) });
      
      for (const server of activeServers) {
          const newStatusRaw = containerStates[server.id];
          const newStatus = newStatusRaw === 'RUNNING' ? 'LIVE' : newStatusRaw;
          const stats = usage.containerStats?.[server.id];
          
          let hasChanges = false;
          const updateData: any = {};

          if (server.status !== newStatus) {
              updateData.status = newStatus;
              hasChanges = true;
          }

          if (stats) {
              const newPlayerCount = (stats.players || []).length;
              if (server.playerCount !== newPlayerCount) {
                  updateData.playerCount = newPlayerCount;
                  hasChanges = true;
              }
              // We skip high-frequency CPU/RAM updates in DB to save I/O
              // These should be handled by WebSockets only
          }

          if (server.status === 'PROVISIONING' && (newStatus === 'STARTING' || newStatus === 'LIVE')) {
              updateData.status = 'LIVE';
              updateData.progress = 100;
              hasChanges = true;
          }

          if (hasChanges) {
              await this.serverRepository.update({ id: server.id }, updateData);
          }
      }
  }

  async deployServer(dto: CreateServerDto) {
      this.logger.log(`Queueing deployment for ${dto.gameType} (User: ${dto.userId})`);
      
      // Add to BullMQ Queue
      // The frontend will receive 'provisioning' status immediately
      // The background worker will pick this up and call deployServerTask
      await this.deployQueue.add('deploy-server', dto, {
          removeOnComplete: true,
          removeOnFail: false
      });

      return {
          status: 'provisioning',
          message: 'Deployment queued successfully.'
      };
  }

  /**
   * Actual logic executed by the background worker
   */
  async deployServerTask(dto: CreateServerDto, job?: Job) {
    this.logger.log(`[Worker] Starting deployment task for ${dto.gameType}`);
    const updateProgress = async (val: number) => {
        if (job) await job.updateProgress(val);
    };

    try {
        await updateProgress(5);
        let template: any = this.gamesService.findOne(dto.gameType);
        if (!template && !dto.customImage) throw new BadRequestException(`Unknown game type: ${dto.gameType}`);

        if (dto.customImage) {
            template = { dockerImage: dto.customImage, defaultPort: 25565, defaultEnv: [] };
        }

        await updateProgress(10);
        const nodes = await this.nodesService.findAll();
        let onlineNodes = nodes.filter(n => n.status === 'ONLINE');
        if (dto.location) {
            const regionalNodes = onlineNodes.filter(n => n.location === dto.location);
            if (regionalNodes.length > 0) onlineNodes = regionalNodes;
        }
        if (onlineNodes.length === 0) throw new ServiceUnavailableException('No online nodes available.');

        const targetNode = onlineNodes[0];
        const port = 20000 + Math.floor(Math.random() * 1000);
        
        const nameEnv = dto.env?.find(e => e.startsWith('SERVER_NAME='));
        const serverName = nameEnv ? nameEnv.split('=')[1] : `Server-${nanoid(4)}`;
        
        const sftpUsername = `user_${nanoid(8)}`;
        const sftpPassword = nanoid(16);

        await updateProgress(20);
        const dnsIp = targetNode.externalIp || targetNode.publicIp;
        let subdomain = '';
        if (dnsIp) {
            const cleanName = this.dnsService.sanitize(serverName);
            const sub = cleanName || `server-${nanoid(4)}`;
            const fullDomain = await this.dnsService.createRecord(sub, dnsIp, port);
            if (fullDomain) subdomain = fullDomain;
        }

        await updateProgress(40);
        let resolvedMods: any[] = [];
        if (dto.mods && dto.mods.length > 0) resolvedMods = this.modsService.resolveDependencies(dto.mods);

        const server = this.serverRepository.create({
            userId: dto.userId,
            nodeId: targetNode.id,
            gameType: dto.gameType,
            name: serverName,
            dockerImage: template.dockerImage,
            port: port,
            memoryLimitMb: dto.memoryLimitMb,
            status: 'PROVISIONING',
            progress: 50,
            env: dto.env || [],
            autoUpdate: dto.autoUpdate ?? true,
            restartSchedule: dto.restartSchedule,
            sftpUsername,
            sftpPassword,
            subdomain
        });
        
        const savedServer = await this.serverRepository.save(server);

        await updateProgress(60);
        await this.commandsService.create({
            targetNodeId: targetNode.id,
            type: CommandType.START_SERVER,
            payload: {
                serverId: savedServer.id,
                image: template.dockerImage,
                port: port,
                internalPort: template.defaultPort,
                memoryLimitMb: dto.memoryLimitMb,
                env: [
                    ...template.defaultEnv, 
                    ...(dto.env || []),
                    `IP=${targetNode.vpnIp || '0.0.0.0'}`,
                    `PORT=${port}`
                ],
                mods: resolvedMods,
                bindIp: targetNode.vpnIp || '0.0.0.0'
            }
        });

        await updateProgress(100);
        await this.serverRepository.update({ id: savedServer.id }, { progress: 100 });

        return { serverId: savedServer.id, subdomain };
    } catch (error: any) {
        this.logger.error(`Deployment task failed: ${error.message}`);
        throw error;
    }
  }

  async update(id: string, dto: Partial<CreateServerDto>) {
      const server = await this.serverRepository.findOneBy({ id });
      if (!server) throw new NotFoundException('Server not found');

      // Update fields
      if (dto.env) server.env = dto.env;
      if (dto.memoryLimitMb) server.memoryLimitMb = dto.memoryLimitMb;
      
      await this.serverRepository.save(server);

      // Trigger restart to apply changes
      return this.setServerStatus(id, 'restart');
  }

  async setServerStatus(id: string, action: 'start' | 'stop' | 'restart') {
    const server = await this.serverRepository.findOne({ 
        where: { id },
        relations: ['node']
    });
    if (!server) throw new BadRequestException('Server not found');

    let newStatus: string = server.status;
    let commandType = CommandType.START_SERVER;
    let payload: any = { serverId: server.id };

    if (action === 'stop') {
        newStatus = 'STOPPED';
        commandType = CommandType.STOP_SERVER;
        payload.containerId = server.id;
    } else if (action === 'start' || action === 'restart') {
        newStatus = 'STARTING';
        commandType = action === 'restart' ? CommandType.RESTART_SERVER : CommandType.START_SERVER;
        
        // Find game template for default port
        const template = this.gamesService.findOne(server.gameType);
        
        payload = {
            serverId: server.id,
            image: server.dockerImage,
            port: server.port,
            internalPort: template?.defaultPort || 25565,
            memoryLimitMb: server.memoryLimitMb,
            env: [
                ...(template?.defaultEnv || []),
                ...(server.env || []),
                `IP=${server.node?.vpnIp || '0.0.0.0'}`,
                `PORT=${server.port}`
            ],
            bindIp: server.node?.vpnIp || '0.0.0.0'
        };
    }

    await this.commandsService.create({
        targetNodeId: server.nodeId,
        type: commandType,
        payload
    });

    server.status = newStatus;
    return this.serverRepository.save(server);
  }

  async delete(id: string) {
    const server = await this.serverRepository.findOneBy({ id });
    if (!server) throw new BadRequestException('Server not found');

    if (server.subdomain) {
        const sub = server.subdomain.split('.')[0];
        await this.dnsService.deleteRecord(sub);
    }

    await this.commandsService.create({
        targetNodeId: server.nodeId,
        type: CommandType.STOP_SERVER,
        payload: { serverId: server.id, purge: true }
    });

    await this.serverRepository.remove(server);
    return { status: 'deleted' };
  }

  async getMetrics(id: string) {
      return this.metricRepository.find({
          where: { serverId: id },
          order: { timestamp: 'DESC' },
          take: 100
      });
  }
}

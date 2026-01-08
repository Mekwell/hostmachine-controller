import { Injectable, Logger, ServiceUnavailableException, BadRequestException, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { CreateServerDto } from './dto/create-server.dto';
import { NodesService } from '../nodes/nodes.service';
import { CommandsService } from '../commands/commands.service';
import { CommandType } from '../commands/dto/create-command.dto';
import { GamesService } from '../games/games.service';
import { ModsService } from '../mods/mods.service';
import { DnsService } from '../dns/dns.service';
import { Server } from './entities/server.entity';
import { Metric } from './entities/metric.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { ConsoleGateway } from '../console/console.gateway';

const generateId = (length: number = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
};

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
    private consoleGateway: ConsoleGateway,
    @InjectQueue('deploy') private deployQueue: Queue
  ) {}

  async findBySubdomain(subdomain: string) {
      const server = await this.serverRepository.findOne({
          where: { subdomain: Like(`${subdomain}%`) },
          relations: ['node']
      });
      if (!server) throw new NotFoundException('Server not found for this domain');
      
      return {
          id: server.id,
          name: server.name,
          status: server.status,
          port: server.port,
          nodeIp: server.node?.vpnIp || server.node?.publicIp
      };
  }

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
    // Validate UUID format before querying database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return null;
    }

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
      
      // Filter for valid UUIDs only (Game Servers)
      // This prevents 'ollama', 'netdata', etc from causing Postgres string_to_uuid errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const runningIds = Object.keys(containerStates).filter(id => uuidRegex.test(id));
      
      this.logger.log(`Processing heartbeat for ${runningIds.length} game containers...`);

      // 1. Mark missing servers as OFFLINE (Only those not already offline/stopped)
      // We only target servers that SHOULD be on this node
      const nodeQuery = this.serverRepository.createQueryBuilder()
          .update()
          .set({ status: 'OFFLINE', playerCount: 0, cpuUsage: 0, ramUsage: 0 })
          .where("status NOT IN ('OFFLINE', 'STOPPED', 'PROVISIONING', 'STARTING')");

      // Only apply the NOT IN filter if we have valid running game containers
      if (runningIds.length > 0) {
          nodeQuery.andWhere("id NOT IN (:...ids)", { ids: runningIds });
      }
      
      try {
          await nodeQuery.execute();
      } catch (e) {
          this.logger.error(`Heartbeat update failed during OFFLINE sync: ${e.message}`);
      }

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
              
              if (newPlayerCount > 0) {
                  updateData.lastPlayerActivity = new Date();
                  hasChanges = true;
              } else if (!server.lastPlayerActivity) {
                  updateData.lastPlayerActivity = new Date();
                  hasChanges = true;
              }
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
    try {
      this.logger.log(`Requesting deployment for ${dto.gameType} (User: ${dto.userId})`);

            // 1. Validation & Node Selection (Synchronous)
            const template: any = await this.gamesService.findOne(dto.gameType);
            if (!template) throw new BadRequestException(`Unknown game type: ${dto.gameType}. Every deployment must use a valid Egg definition.`);
      
            const nodes = await this.nodesService.findAll();
            let onlineNodes = nodes.filter(n => n.status === 'ONLINE');
      
            // Filter by OS Requirement
            if (template.requiredOs === 'windows') {
                onlineNodes = onlineNodes.filter(n => n.specs?.osPlatform?.toLowerCase().includes('windows'));  
            } else {
                onlineNodes = onlineNodes.filter(n => !n.specs?.osPlatform?.toLowerCase().includes('windows')); 
            }
      
            if (dto.location) {
                const regionalNodes = onlineNodes.filter(n => n.location === dto.location);
                if (regionalNodes.length > 0) onlineNodes = regionalNodes;
            }
            if (onlineNodes.length === 0) throw new ServiceUnavailableException(`No online ${template.requiredOs || 'linux'} nodes available.`);
      
            const targetNode = onlineNodes[0];
      
            // 2. Create Placeholder Entity
            const nameEnv = dto.env?.find(e => e.startsWith('SERVER_NAME='));
            const serverName = nameEnv ? nameEnv.split('=')[1] : `Server-${generateId(4)}`;
            const newServerId = uuidv4();
      
            const server = this.serverRepository.create({
                id: newServerId,
                userId: dto.userId,
                nodeId: targetNode.id,
                gameType: dto.gameType,
                name: serverName,
                dockerImage: template.dockerImage,
                port: 0,
                memoryLimitMb: dto.memoryLimitMb,          status: 'PROVISIONING',
          progress: 5,
          env: dto.env || [],
          autoUpdate: dto.autoUpdate ?? true,
          restartSchedule: dto.restartSchedule,
          sftpUsername: `user_${generateId(8)}`, 
          sftpPassword: generateId(16)
      });
      
      const savedServer = await this.serverRepository.save(server);

      // 3. Queue Provisioning
      await this.deployQueue.add('deploy-server', { 
          serverId: savedServer.id,
          template, 
          nodeId: targetNode.id,
          ...dto 
      }, {
          jobId: savedServer.id, // DEDUPLICATION: Prevents multiple jobs for same server
          removeOnComplete: true,
          removeOnFail: false
      });

      this.logger.log(`Server ${savedServer.id} created and queued.`);

      return {
          status: 'provisioning',
          serverId: savedServer.id,
          message: 'Server created. Provisioning started.'
      };
    } catch (err: any) {
        this.logger.error(`deployServer Failed: ${err.message}`, err.stack);
        throw err;
    }
  }

  /**
   * Actual logic executed by the background worker
   */
  async deployServerTask(jobData: any, job?: Job) {
    const { serverId, nodeId, gameType, customImage } = jobData;
    this.logger.log(`[Worker] Starting provisioning for Server ${serverId}`);
    
    const updateProgress = async (val: number, msg: string) => {
        if (job) await job.updateProgress(val);
        await this.serverRepository.update({ id: serverId }, { progress: val, statusMessage: msg });
    };

        try {
            await updateProgress(5, 'Synchronizing Node configuration...');
    
            // Fetch Template again in context
            let template: any = await this.gamesService.findOne(gameType);
            if (!template) throw new Error(`Game egg definition for '${gameType}' not found. Cannot provision without an Egg.`);
    
            // Fetch fresh server state        const server = await this.serverRepository.findOneBy({ id: serverId });
        if (!server) throw new Error('Server entity missing in worker');

        // Verify Node
        const targetNode = await this.nodesService.findOne(nodeId);
        if (!targetNode) throw new Error('Target node disappeared');

        await updateProgress(20, 'Verifying Docker environment...');
        
        // Allocate Port
        const port = 20000 + Math.floor(Math.random() * 1000); 
        
        // DNS
        const dnsIp = targetNode.externalIp || targetNode.publicIp;
        let subdomain = '';
        if (dnsIp) {
            await updateProgress(30, 'Allocating secure subdomain...');
            const cleanName = this.dnsService.sanitize(server.name);
            const sub = cleanName || `server-${generateId(4)}`;
            const fullDomain = await this.dnsService.createRecord(sub, dnsIp, port);
            if (fullDomain) subdomain = fullDomain;
        }

        await updateProgress(40, 'Hydrating custom mods and assets...');
        let resolvedMods: any[] = [];
        if (jobData.mods && jobData.mods.length > 0) resolvedMods = this.modsService.resolveDependencies(jobData.mods);

        // Update Server with Port/DNS
        server.port = port;
        server.subdomain = subdomain;
        await this.serverRepository.save(server);

        await updateProgress(60, 'Triggering Docker pull and container creation...');
        
        const queryPort = port + 1;

        await this.commandsService.create({
            targetNodeId: targetNode.id,
            type: CommandType.START_SERVER,
            payload: {
                serverId: server.id,
                image: server.dockerImage,
                port: port,
                internalPort: port,
                installScript: template.installScript,
                installContainerImage: template.installContainerImage,
                installEntrypoint: template.installEntrypoint,
                startupCommand: template.startupCommand,
                memoryLimitMb: server.memoryLimitMb,
                env: [
                    ...(template.defaultEnv || []), 
                    ...(server.env || []),
                    `SERVER_ID=${server.id}`,
                    `IP=${targetNode.vpnIp || '0.0.0.0'}`,
                    `PORT=${port}`,
                    `QUERY_PORT=${queryPort}`
                ],
                mods: resolvedMods,
                bindIp: targetNode.vpnIp || '0.0.0.0'
            }
        });

        await updateProgress(90, 'Applying firewall and network rules...');
        
        // Brief pause to simulate finalize
        await new Promise(r => setTimeout(r, 2000));

        await updateProgress(100, 'Handshake complete. Booting game engine...');
        await this.serverRepository.update({ id: serverId }, { status: 'STARTING', progress: 100 });

        return { serverId: server.id, subdomain };
    } catch (error: any) {
        this.logger.error(`Provisioning failed: ${error.message}`);
        await this.serverRepository.update({ id: serverId }, { status: 'FAILED', statusMessage: `Error: ${error.message}` });
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
        payload.purge = false; // "Always up" logic

        // Try soft-stop via WebSocket first (Instant)
        this.consoleGateway.server.to(`server:${server.id}`).emit('stop-server');
    } else if (action === 'start' || action === 'restart') {
        newStatus = 'STARTING';
        commandType = action === 'restart' ? CommandType.RESTART_SERVER : CommandType.START_SERVER;
        
        // Try soft-start via WebSocket first
        if (action === 'start') {
            this.consoleGateway.server.to(`server:${server.id}`).emit('start-server');
        }

        // Find game template for default port
        const template = await this.gamesService.findOne(server.gameType);
        const queryPort = server.port + 1;
        
        payload = {
            serverId: server.id,
            image: server.dockerImage,
            port: server.port,
            internalPort: server.port,
            installScript: template?.installScript,
            installContainerImage: template?.installContainerImage,
            installEntrypoint: template?.installEntrypoint,
            startupCommand: template?.startupCommand,
            memoryLimitMb: server.memoryLimitMb,
            env: [
                ...(template?.defaultEnv || []),
                ...(server.env || []),
                `SERVER_ID=${server.id}`,
                `IP=${server.node?.vpnIp || '0.0.0.0'}`,
                `PORT=${server.port}`,
                `QUERY_PORT=${queryPort}`
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
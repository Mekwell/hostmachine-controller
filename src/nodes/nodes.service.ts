import { Injectable, Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterNodeDto } from './dto/register-node.dto';
import { Node } from './entities/node.entity';
import { v4 as uuidv4 } from 'uuid';
import { ServersService } from '../servers/servers.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  
  constructor(
    @InjectRepository(Node)
    private nodesRepository: Repository<Node>,
    @Inject(forwardRef(() => ServersService))
    private serversService: ServersService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterNodeDto) {
    this.logger.log(`Registering Node: ${registerDto.specs.hostname}`);

    const validSecret = process.env.ENROLLMENT_SECRET; 
    if (!validSecret || registerDto.enrollmentToken !== validSecret) {
       this.logger.warn(`Failed registration attempt with token: ${registerDto.enrollmentToken}`);
       throw new UnauthorizedException('Invalid Enrollment Token');
    }

    const newNode = this.nodesRepository.create({
      hostname: registerDto.specs.hostname,
      specs: registerDto.specs,
      vpnIp: registerDto.vpnIp,
      location: registerDto.location || 'Sydney',
      status: 'ONLINE',
      apiKey: uuidv4(),
    });

    await this.nodesRepository.save(newNode);
    this.logger.log(`Node Registered! ID: ${newNode.id}`);

    return {
      status: 'success',
      nodeId: newNode.id,
      apiKey: newNode.apiKey,
      message: 'Welcome to the Fleet.'
    };
  }

  findAll() {
    return this.nodesRepository.find();
  }

  findOne(id: string) {
    return this.nodesRepository.findOneBy({ id });
  }

  async validateApiKey(nodeId: string, apiKey: string): Promise<boolean> {
      // Still need cold data check for the API key
      const node = await this.nodesRepository.findOneBy({ id: nodeId });
      return !!(node && node.apiKey === apiKey);
  }

  async updateUsage(nodeId: string, usage: any) {
    // HOT DATA: Write to Redis with TTL
    const redisKey = `node:${nodeId}:status`;
    await this.redisService.client.set(redisKey, JSON.stringify({
        ...usage,
        lastSeen: new Date().toISOString()
    }), 'EX', 60); // 60s TTL

    // Update Presence in Redis
    await this.redisService.client.set(`node:${nodeId}:presence`, 'online', 'EX', 45);

    // COLD DATA: Background update to Postgres (Throttled)
    // Only update DB if last seen is older than 2 minutes to keep Postgres clean
    const node = await this.nodesRepository.findOneBy({ id: nodeId });
    if (node) {
        const now = new Date();
        const lastSeen = node.lastSeen ? new Date(node.lastSeen).getTime() : 0;
        
        if (now.getTime() - lastSeen > 120000) {
            await this.nodesRepository.update(nodeId, { 
                lastSeen: now, 
                status: 'ONLINE',
                publicIp: usage.publicIp || node.publicIp,
                vpnIp: usage.vpnIp || node.vpnIp
            });
        }
    }

    // Process container statuses
    if (usage.containerStates) {
        await this.serversService.updateStatusFromHeartbeat(usage);
    }

    return { status: 'acknowledged' };
  }

  async getNodeStatus(nodeId: string) {
      const hotData = await this.redisService.client.get(`node:${nodeId}:status`);
      if (hotData) return JSON.parse(hotData);
      
      // Fallback to cold data
      return this.findOne(nodeId);
  }

  async remove(id: string) {
      await this.nodesRepository.delete(id);
      await this.redisService.client.del(`node:${id}:status`);
      return { status: 'deleted', id };
  }
}

import { Injectable, Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterNodeDto } from './dto/register-node.dto';
import { Node } from './entities/node.entity';
import { v4 as uuidv4 } from 'uuid';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  
  constructor(
    @InjectRepository(Node)
    private nodesRepository: Repository<Node>,
    @Inject(forwardRef(() => ServersService))
    private serversService: ServersService,
  ) {}

  async register(registerDto: RegisterNodeDto) {
    this.logger.log(`Registering Node: ${registerDto.specs.hostname}`);

    // SECURITY: Check against a secret configured in the environment
    const validSecret = process.env.ENROLLMENT_SECRET || 'valid-token'; 
    if (registerDto.enrollmentToken !== validSecret) {
       this.logger.warn(`Failed registration attempt with token: ${registerDto.enrollmentToken}`);
       throw new UnauthorizedException('Invalid Enrollment Token');
    }

    // Check if node already exists (by hostname) to avoid duplicates?
    // For now, we allow re-registration which might generate a new ID/Key
    
    const newNode = this.nodesRepository.create({
      hostname: registerDto.specs.hostname,
      specs: registerDto.specs,
      vpnIp: registerDto.vpnIp,
      location: registerDto.location || 'Australia', // Default to Australia
      status: 'ONLINE',
      apiKey: uuidv4(), // Generate High-Entropy Key
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
      const node = await this.nodesRepository.findOneBy({ id: nodeId });
      if (node && node.apiKey === apiKey) {
          // Update last seen
          node.lastSeen = new Date();
          node.status = 'ONLINE';
          await this.nodesRepository.save(node);
          return true;
      }
      return false;
  }

  getEnrollmentCommand() {
    const apiUrl = process.env.PUBLIC_API_URL || 'https://api.hostmachine.net';
    const secret = process.env.ENROLLMENT_SECRET || 'valid-token';
    return `curl -sSL ${apiUrl}/install.sh | sudo bash -s -- --token ${secret} --url ${apiUrl}`;
  }

  async remove(id: string) {
      this.logger.log(`Removing Node: ${id}`);
      await this.nodesRepository.delete(id);
      return { status: 'deleted', id };
  }

  async updateUsage(nodeId: string, usage: any) {
    const node = await this.nodesRepository.findOneBy({ id: nodeId });
    if (node) {
      node.usage = usage;
      if (usage.publicIp) {
          node.publicIp = usage.publicIp;
      }
      if (usage.vpnIp) {
          this.logger.log(`Setting VPN IP: ${usage.vpnIp}`);
          node.vpnIp = usage.vpnIp;
      }
      
      // Manual Override for Vultr Hub (Prototype)
      if (node.hostname === 'hm-node1') {
          node.externalIp = '139.180.160.207';
      }

      node.lastSeen = new Date();
      node.status = 'ONLINE';
      
      // Update Container Status & Metadata
      if (usage.containerStates) {
          // Pass the full usage object to handle stats mapping
          await this.serversService.updateStatusFromHeartbeat(usage);
      } else if (usage.containers && Array.isArray(usage.containers)) {
          // Fallback for legacy heartbeats
          const fallbackMap: Record<string, string> = {};
          usage.containers.forEach((id: string) => fallbackMap[id] = 'RUNNING');
          await this.serversService.updateStatusFromHeartbeat({ containerStates: fallbackMap });
      }

      return this.nodesRepository.save(node);
    }
  }
}
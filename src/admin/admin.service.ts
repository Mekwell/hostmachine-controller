import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from '../nodes/entities/node.entity';
import { Server } from '../servers/entities/server.entity';
import { Subscription } from '../billing/entities/subscription.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Node)
    private nodeRepository: Repository<Node>,
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(Subscription)
    private subRepository: Repository<Subscription>,
  ) {}

  async getSystemState() {
    const nodes = await this.nodeRepository.find();
    const servers = await this.serverRepository.find();
    
    // Auto-Fix Mismatched Plans (Temporary migration logic)
    await this.nodeRepository.query("UPDATE plan SET gameId = 'minecraft' WHERE gameId = 'minecraft-java'");
    await this.nodeRepository.query("UPDATE plan SET gameId = 'vh' WHERE gameId = 'vh'"); // Already fine but ensuring
    
    // Merge Live Data...
    // Note: In a real app, we'd use Redis for the live heartbeat data. 
    // For now, we assume Node entity 'specs' or a new field 'lastHeartbeatData' 
    // was updated. Since we don't persist transient heartbeat detailed stats 
    // to SQL every second, we rely on what's in the DB + what we can infer.
    
    // Ideally, NodesService should expose a method to get the cached "Live" state.
    // For this prototype, we'll map the registered servers.
    
    return nodes.map(node => {
        // Find servers assigned to this node
        const nodeServers = servers.filter(s => s.nodeId === node.id);
        
        return {
            ...node,
            activeContainers: nodeServers.map(s => ({
                id: s.id,
                name: s.name,
                game: s.gameType,
                owner: s.userId, // This is the Owner ID
                status: s.status,
                port: s.port
            }))
        };
    });
  }

  async getUsers() {
    // Aggregate unique users from Subscriptions and Servers
    const subs = await this.subRepository.find({ relations: ['plan'] });
    const servers = await this.serverRepository.find();

    const userMap = new Map<string, any>();

    subs.forEach(sub => {
        if (!userMap.has(sub.userId)) {
            userMap.set(sub.userId, { 
                id: sub.userId, 
                email: `user-${sub.userId.substring(0,6)}@example.com`, // Mock email since we don't have User table
                servers: 0, 
                spent: 0,
                plans: []
            });
        }
        const u = userMap.get(sub.userId);
        u.plans.push(sub.plan.name);
        u.spent += sub.plan.price;
    });

    servers.forEach(srv => {
        if (!userMap.has(srv.userId)) {
             userMap.set(srv.userId, { 
                id: srv.userId, 
                email: `user-${srv.userId.substring(0,6)}@example.com`,
                servers: 0, 
                spent: 0,
                plans: []
            });
        }
        const u = userMap.get(srv.userId);
        u.servers++;
    });

    return Array.from(userMap.values());
  }
}

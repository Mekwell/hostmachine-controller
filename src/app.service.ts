import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from './nodes/entities/node.entity';
import { Plan } from './plans/entities/plan.entity';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
    @InjectRepository(Plan)
    private planRepo: Repository<Plan>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking for seed data...');

    // Seed Admin User
    const adminEmail = 'mekwell@hotmail.com';
    const adminExists = await this.userRepo.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
        this.logger.log(`Seeding admin user: ${adminEmail}`);
        const hashedPassword = await bcrypt.hash('mekwell', 10);
        const admin = this.userRepo.create({
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });
        await this.userRepo.save(admin);
    }

    // 1. Seed Plans
    const planCount = await this.planRepo.count();
    if (planCount === 0) {
      this.logger.log('Seeding plans...');
      const plans: any[] = [
        { name: 'Minecraft: Grass Tier', description: 'Basic Minecraft node', price: 5, ramMb: 2048, cpuCores: 1, type: 'fixed', gameId: 'minecraft-java' },
        { name: 'Minecraft: Stone Tier', description: 'Advanced Minecraft node', price: 10, ramMb: 4096, cpuCores: 2, type: 'fixed', gameId: 'minecraft-java' },
        { name: 'Flexi: Entry Block', description: 'Small resource pool', price: 15, ramMb: 8192, cpuCores: 4, type: 'flexi' },
        { name: 'Flexi: Core Block', description: 'Medium resource pool', price: 30, ramMb: 16384, cpuCores: 8, type: 'flexi' },
      ];
      await this.planRepo.save(this.planRepo.create(plans));
    }

    // 2. Seed Nodes
    // Removed placeholder nodes as per user request. 
    // Real nodes will register dynamically.
  }

  getHello(): string {
    return 'HostMachine Controller Active.';
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
  ) {}

  async onModuleInit() {
    const count = await this.plansRepository.count();
    if (count === 0) {
      console.log('Seeding default plans...');
      const plans = [
        {
            name: 'Basic Minecraft Block',
            description: 'Entry-level resource for small friend groups',
            price: 5,
            ramMb: 2048,
            cpuCores: 1,
            type: 'fixed' as const,
            gameId: 'minecraft-java',
            isActive: true
        },
        {
            name: 'Minecraft Specialized',
            description: 'Optimized for high-tickrate Minecraft worlds',
            price: 12,
            ramMb: 6144,
            cpuCores: 2,
            type: 'fixed' as const,
            gameId: 'minecraft-java',
            isActive: true
        },
        {
            name: 'Rust Survivor',
            description: 'High-memory block for large Rust maps',
            price: 24,
            ramMb: 12288,
            cpuCores: 4,
            type: 'fixed' as const,
            gameId: 'rust',
            isActive: true
        },
        {
            name: 'CS2 Tactical',
            description: '128-tick optimized tactical module',
            price: 15,
            ramMb: 4096,
            cpuCores: 4,
            type: 'fixed' as const,
            gameId: 'cs2',
            isActive: true
        },
        {
            name: 'Universal Module',
            description: 'Deploy any curated game server from our grid.',
            price: 10,
            ramMb: 4096,
            cpuCores: 2,
            type: 'fixed' as const,
            isActive: true
        },
        {
            name: 'Lite Resource Pool',
            description: '8GB Resource block for dynamic module management.',
            price: 25,
            ramMb: 8192,
            cpuCores: 4,
            type: 'flexi' as const,
            isActive: true
        },
        {
            name: 'Pro Resource Pool',
            description: '16GB Resource block for multi-instance fleets.',
            price: 45,
            ramMb: 16384,
            cpuCores: 8,
            type: 'flexi' as const,
            isActive: true
        },
        {
            name: 'Enterprise Pool',
            description: '32GB Massive resource block for large networks.',
            price: 80,
            ramMb: 32768,
            cpuCores: 12,
            type: 'flexi' as const,
            isActive: true
        },
        {
            name: 'Titan Pool',
            description: '64GB Ultra-tier block for massive game clusters.',
            price: 150,
            ramMb: 65536,
            cpuCores: 16,
            type: 'flexi' as const,
            isActive: true
        }
      ];
      
      for (const p of plans) {
        await this.plansRepository.save(this.plansRepository.create(p));
      }
    }
  }

  create(createPlanDto: CreatePlanDto) {
    const plan = this.plansRepository.create(createPlanDto);
    return this.plansRepository.save(plan);
  }

  findAll() {
    return this.plansRepository.find({ order: { price: 'ASC' } });
  }

  findOne(id: string) {
    return this.plansRepository.findOneBy({ id });
  }

  async remove(id: string) {
    await this.plansRepository.delete(id);
    return { deleted: true };
  }
}
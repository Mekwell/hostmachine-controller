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
    const existingPlans = await this.plansRepository.find();
    
    const allDefaultPlans = [
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
        },
        {
            name: 'ARK: Ascended Basic',
            description: 'Basic requirement for ARK Survival Ascended',
            price: 35,
            ramMb: 16384,
            cpuCores: 4,
            type: 'fixed' as const,
            gameId: 'asa',
            isActive: true
        },
        {
            name: 'ARK: Ascended Pro',
            description: 'Stable performance for active tribes',
            price: 60,
            ramMb: 32768,
            cpuCores: 8,
            type: 'fixed' as const,
            gameId: 'asa',
            isActive: true
        },
        {
            name: 'ARK: Ascended Titan',
            description: 'Max performance for massive clusters',
            price: 110,
            ramMb: 65536,
            cpuCores: 12,
            type: 'fixed' as const,
            gameId: 'asa',
            isActive: true
        },
        {
            name: 'ARK: Ascended (Win-Native)',
            description: 'Optimized build for Windows Server nodes',
            price: 40,
            ramMb: 16384,
            cpuCores: 4,
            type: 'fixed' as const,
            gameId: 'asa-win',
            isActive: true
        }
    ];

    for (const planData of allDefaultPlans) {
        const exists = existingPlans.find(p => p.name === planData.name);
        if (!exists) {
            console.log(`Adding missing plan: ${planData.name}`);
            await this.plansRepository.save(this.plansRepository.create(planData));
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

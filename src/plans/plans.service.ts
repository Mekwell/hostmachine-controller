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
        // Minecraft Java Plans
        {
            name: 'Java Entry Block',
            description: 'Optimized PaperMC for small groups.',
            price: 8,
            ramMb: 4096,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'minecraft-java',
            isActive: true
        },
        {
            name: 'Java Performance Pro',
            description: 'High-tickrate optimization for large worlds.',
            price: 18,
            ramMb: 8192,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'minecraft-java',
            isActive: true
        },
        // Minecraft Bedrock Plans
        {
            name: 'Bedrock Mobile Node',
            description: 'Native Bedrock core for cross-play.',
            price: 6,
            ramMb: 2048,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'minecraft-bedrock',
            isActive: true
        },
        {
            name: 'Bedrock Console Titan',
            description: 'Maximum render distance for Bedrock fleets.',
            price: 15,
            ramMb: 6144,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'minecraft-bedrock',
            isActive: true
        },
        // Minecraft Modded Plans (Heavy)
        {
            name: 'Modded Starter Block',
            description: 'Entry-level Forge/Fabric resource.',
            price: 25,
            ramMb: 12288,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'minecraft-forge',
            isActive: true
        },
        {
            name: 'Forge Mega-Stack',
            description: 'Enterprise-grade RAM for heavy modpacks.',
            price: 45,
            ramMb: 24576,
            cpuCores: 8,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'minecraft-forge',
            isActive: true
        },
        {
            name: 'Fabric Ultra-Node',
            description: 'Ultra-low latency Fabric optimization.',
            price: 35,
            ramMb: 16384,
            cpuCores: 6,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'minecraft-fabric',
            isActive: true
        },
        // Original seed plans (updated with tiers)
        {
            name: 'Universal Module',
            description: 'Deploy any curated game server from our grid.',
            price: 10,
            ramMb: 4096,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            isActive: true
        },
        {
            name: 'Lite Resource Pool',
            description: '8GB Resource block for dynamic module management.',
            price: 25,
            ramMb: 8192,
            cpuCores: 4,
            type: 'flexi' as const,
            tier: 'budget' as const,
            isActive: true
        },
        {
            name: 'Pro Resource Pool',
            description: '16GB Resource block for multi-instance fleets.',
            price: 45,
            ramMb: 16384,
            cpuCores: 8,
            type: 'flexi' as const,
            tier: 'premium' as const,
            isActive: true
        },
        {
            name: 'ARK: Ascended Basic',
            description: 'Basic requirement for ARK Survival Ascended',
            price: 35,
            ramMb: 16384,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'budget' as const,
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
            tier: 'premium' as const,
            gameId: 'asa',
            isActive: true
        }
    ];

    for (const planData of allDefaultPlans) {
        const exists = existingPlans.find(p => p.name === planData.name);
        if (!exists) {
            console.log(`Adding missing plan: ${planData.name}`);
            await this.plansRepository.save(this.plansRepository.create(planData));
        } else if (!exists.tier || (planData.gameId && !exists.gameId)) {
            // Update existing if tier is missing or gameId is now specified
            await this.plansRepository.update(exists.id, { 
                tier: planData.tier,
                gameId: planData.gameId || exists.gameId 
            });
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

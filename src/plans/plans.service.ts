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
            name: 'ARK: Ascended Survivor',
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
            name: 'ARK: Ascended Alpha',
            description: 'Stable performance for active tribes',
            price: 60,
            ramMb: 32768,
            cpuCores: 8,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'asa',
            isActive: true
        },
        // Rust Plans
        {
            name: 'Rust Naked Node',
            description: 'Standard performance for small-medium maps.',
            price: 15,
            ramMb: 8192,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'rust',
            isActive: true
        },
        {
            name: 'Rust Oxide Titan',
            description: 'High-RAM instance for large maps and heavy plugins.',
            price: 30,
            ramMb: 16384,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'rust',
            isActive: true
        },
        // CS2 Plans
        {
            name: 'CS2 Competitive',
            description: 'Standard 128-tick reliable hosting.',
            price: 10,
            ramMb: 4096,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'cs2',
            isActive: true
        },
        {
            name: 'CS2 eSports Grade',
            description: 'Pinned CPU cores for tournament stability.',
            price: 20,
            ramMb: 8192,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'cs2',
            isActive: true
        },
        // Palworld Plans
        {
            name: 'Palworld Explorer',
            description: 'Entry level for small co-op groups.',
            price: 18,
            ramMb: 12288,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'palworld',
            isActive: true
        },
        {
            name: 'Palworld Guild Base',
            description: 'Massive RAM overhead for long-uptime stability.',
            price: 35,
            ramMb: 24576,
            cpuCores: 6,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'palworld',
            isActive: true
        },
        // Project Zomboid Plans
        {
            name: 'Zomboid Survivor',
            description: 'Standard vanilla or light-mod hosting.',
            price: 12,
            ramMb: 6144,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'project-zomboid',
            isActive: true
        },
        {
            name: 'Zomboid Horde',
            description: 'Expanded memory for high zombie counts.',
            price: 22,
            ramMb: 12288,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'project-zomboid',
            isActive: true
        },
        // Valheim Plans
        {
            name: 'Valheim Viking',
            description: 'Solid stability for 1-5 players.',
            price: 12,
            ramMb: 4096,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'valheim',
            isActive: true
        },
        {
            name: 'Valheim Longship',
            description: 'Performance headroom for large builds.',
            price: 20,
            ramMb: 8192,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'valheim',
            isActive: true
        },
        // DayZ Plans
        {
            name: 'DayZ Scavenger',
            description: 'Reliable hosting for Chernarus/Livonia.',
            price: 15,
            ramMb: 6144,
            cpuCores: 2,
            type: 'fixed' as const,
            tier: 'budget' as const,
            gameId: 'dayz',
            isActive: true
        },
        {
            name: 'DayZ Warlord',
            description: 'High-performance for modded servers.',
            price: 28,
            ramMb: 12288,
            cpuCores: 4,
            type: 'fixed' as const,
            tier: 'premium' as const,
            gameId: 'dayz',
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

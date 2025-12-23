import { Injectable } from '@nestjs/common';

export interface ModTemplate {
  id: string;
  name: string;
  description: string;
  gameType: string; // e.g., 'rust', 'minecraft', 'gmod'
  category: 'core' | 'plugin' | 'map' | 'config';
  version: string;
  
  // Installation Logic
  downloadUrl: string;
  installPath: string; // Relative to server root, e.g., '/Oxide/plugins'
  fileName?: string; // If undefined, infer from URL
  
  // Dependencies
  requires?: string[]; // IDs of other mods (e.g., 'oxide-core' required for 'gather-manager')
}

@Injectable()
export class ModsService {
  private readonly mods: ModTemplate[] = [
    // --- RUST ---
    {
      id: 'rust-oxide',
      name: 'Oxide (uMod)',
      description: 'The core modding framework for Rust. Required for all plugins.',
      gameType: 'rust',
      category: 'core',
      version: 'latest',
      downloadUrl: 'https://umod.org/games/rust/download',
      installPath: '/', // Extract to root
    },
    {
      id: 'rust-gather-manager',
      name: 'Gather Manager',
      description: 'Control resource gathering rates (10x, 100x servers).',
      gameType: 'rust',
      category: 'plugin',
      version: 'latest',
      downloadUrl: 'https://umod.org/plugins/GatherManager.cs',
      installPath: '/oxide/plugins',
      requires: ['rust-oxide']
    },
    {
      id: 'rust-stack-size',
      name: 'Stack Size Controller',
      description: 'Allow massive item stacks for loot heavy servers.',
      gameType: 'rust',
      category: 'plugin',
      version: 'latest',
      downloadUrl: 'https://umod.org/plugins/StackSizeController.cs',
      installPath: '/oxide/plugins',
      requires: ['rust-oxide']
    },
    {
      id: 'rust-no-decay',
      name: 'No Decay',
      description: 'Disables building upkeep and decay.',
      gameType: 'rust',
      category: 'plugin',
      version: 'latest',
      downloadUrl: 'https://umod.org/plugins/NoDecay.cs',
      installPath: '/oxide/plugins',
      requires: ['rust-oxide']
    },

    // --- MINECRAFT (Paper/Spigot) ---
    {
      id: 'mc-essentialsx',
      name: 'EssentialsX',
      description: 'Essential commands (home, warp, spawn) for servers.',
      gameType: 'mc',
      category: 'plugin',
      version: 'latest',
      downloadUrl: 'https://github.com/EssentialsX/Essentials/releases/latest/download/EssentialsX-2.20.1.jar',
      installPath: '/plugins'
    },
    {
      id: 'mc-worldedit',
      name: 'WorldEdit',
      description: 'In-game map editor and building tool.',
      gameType: 'mc',
      category: 'plugin',
      version: 'latest',
      downloadUrl: 'https://dev.bukkit.org/projects/worldedit/files/latest',
      installPath: '/plugins'
    }
  ];

  findAll(gameType?: string) {
    if (gameType) {
      return this.mods.filter(m => m.gameType === gameType);
    }
    return this.mods;
  }

  findOne(id: string) {
    return this.mods.find(m => m.id === id);
  }

  /**
   * Returns the full list of mods required to install the requested mod IDs.
   * Resolves dependencies recursively.
   */
  resolveDependencies(modIds: string[]): ModTemplate[] {
    const resolved = new Set<string>();
    const queue = [...modIds];
    const result: ModTemplate[] = [];

    while (queue.length > 0) {
      const id = queue.shift();
      if (!id || resolved.has(id)) continue;

      const mod = this.findOne(id);
      if (mod) {
        resolved.add(id);
        result.push(mod);
        if (mod.requires) {
          queue.push(...mod.requires);
        }
      }
    }

    // Sort: Core mods first
    return result.sort((a, b) => (a.category === 'core' ? -1 : 1));
  }
}

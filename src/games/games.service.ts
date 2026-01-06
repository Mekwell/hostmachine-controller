import { Injectable } from '@nestjs/common';

export interface GameVariable {
  name: string;
  description: string;
  envVar: string;
  defaultValue: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  options?: string[]; 
}

export interface GameTemplate {
  id: string;
  name: string;
  type: string;
  category: 'game' | 'voip' | 'web' | 'utility';
  dockerImage: string;
  defaultPort: number;
  defaultEnv: string[];
  configFile?: string; // NEW: Path relative to /data
  icon: string;
  banner?: string;
  description: string;
  variables: GameVariable[];
  requiredOs: 'linux' | 'windows';
}

@Injectable()
export class GamesService {
  private games: GameTemplate[] = [
    { id: 'rust', name: 'Rust', type: 'rust', category: 'game', dockerImage: 'gameservermanagers/gameserver:rust', defaultPort: 28015, defaultEnv: [], configFile: 'server/rustserver/cfg/server.cfg', icon: '☢️', banner: '/banners/rust.jpg', description: 'Hardcore survival.', variables: [], requiredOs: 'linux' },
    { id: 'cs2', name: 'Counter-Strike 2', type: 'cs2', category: 'game', dockerImage: 'gameservermanagers/gameserver:cs2', defaultPort: 27015, defaultEnv: [], configFile: 'serverfiles/game/csgo/cfg/server.cfg', icon: '🔫', banner: '/banners/cs2.jpg', description: 'Tactical shooter.', variables: [], requiredOs: 'linux' },
    { id: 'gmod', name: 'Garrys Mod', type: 'gmod', category: 'game', dockerImage: 'gameservermanagers/gameserver:gmod', defaultPort: 27015, defaultEnv: [], configFile: 'serverfiles/garrysmod/cfg/server.cfg', icon: '🔧', banner: '/banners/gmod.jpg', description: 'Physics sandbox.', variables: [], requiredOs: 'linux' },
    { id: 'pz', name: 'Project Zomboid', type: 'pz', category: 'game', dockerImage: 'gameservermanagers/gameserver:pz', defaultPort: 16261, defaultEnv: [], configFile: 'Zomboid/Server/servertest.ini', icon: '🧟', banner: '/banners/pz.jpg', description: 'Zombie RPG.', variables: [], requiredOs: 'linux' },
    { id: 'tf2', name: 'Team Fortress 2', type: 'tf2', category: 'game', dockerImage: 'gameservermanagers/gameserver:tf2', defaultPort: 27015, defaultEnv: [], configFile: 'serverfiles/tf/cfg/server.cfg', icon: '🎩', banner: '/banners/tf2.jpg', description: 'Arena shooter.', variables: [], requiredOs: 'linux' },
    { id: 'l4d2', name: 'Left 4 Dead 2', type: 'l4d2', category: 'game', dockerImage: 'gameservermanagers/gameserver:l4d2', defaultPort: 27015, defaultEnv: [], configFile: 'serverfiles/left4dead2/cfg/server.cfg', icon: '🧟', banner: '/banners/l4d2.jpg', description: 'Coop shooter.', variables: [], requiredOs: 'linux' },
    { id: 'minecraft-java', name: 'Minecraft (Java)', type: 'mc', category: 'game', dockerImage: 'hostmachine/game-minecraft:latest', defaultPort: 25565, defaultEnv: ["MEMORY=2048", "MOTD=A HostMachine World", "DIFFICULTY=1", "MAX_PLAYERS=20", "EULA=TRUE"], configFile: 'server.properties', icon: '⛏️', banner: '/banners/mc.jpg', description: 'PaperMC high-perf server.', variables: [
        { name: 'Level Name', description: 'World directory name', envVar: 'LEVEL', defaultValue: 'world', type: 'string' },
        { name: 'Game Mode', description: 'Survival, Creative, etc.', envVar: 'MODE', defaultValue: 'survival', type: 'enum', options: ['survival', 'creative', 'adventure', 'spectator'] },
        { name: 'Difficulty', description: '0=Peaceful, 1=Easy, 2=Normal, 3=Hard', envVar: 'DIFFICULTY', defaultValue: '1', type: 'enum', options: ['0', '1', '2', '3'] },
        { name: 'Max Players', description: 'Concurrent slot limit', envVar: 'MAX_PLAYERS', defaultValue: '20', type: 'number' },
        { name: 'Accept EULA', description: 'Must be TRUE to run', envVar: 'EULA', defaultValue: 'TRUE', type: 'boolean' }
    ], requiredOs: 'linux' },
    { id: 'minecraft-bedrock', name: 'Minecraft (Bedrock)', type: 'mc-bedrock', category: 'game', dockerImage: 'itzg/minecraft-bedrock-server:latest', defaultPort: 19132, defaultEnv: ["EULA=TRUE"], configFile: 'server.properties', icon: '📱', banner: '/banners/mc.jpg', description: 'Cross-platform Bedrock edition.', variables: [
        { name: 'Server Name', description: 'Public name', envVar: 'SERVER_NAME', defaultValue: 'HostMachine Bedrock', type: 'string' },
        { name: 'Game Mode', description: 'survival, creative', envVar: 'GAMEMODE', defaultValue: 'survival', type: 'enum', options: ['survival', 'creative'] },
        { name: 'Accept EULA', description: 'Must be TRUE to run', envVar: 'EULA', defaultValue: 'TRUE', type: 'boolean' }
    ], requiredOs: 'linux' },
    { id: 'minecraft-forge', name: 'Minecraft (Forge)', type: 'mc-forge', category: 'game', dockerImage: 'itzg/minecraft-server:latest', defaultPort: 25565, defaultEnv: ["TYPE=FORGE", "MEMORY=4G", "EULA=TRUE"], configFile: 'server.properties', icon: '⚒️', banner: '/banners/mc.jpg', description: 'Modded Minecraft with Forge.', variables: [
        { name: 'Forge Version', description: 'Leave empty for latest', envVar: 'FORGE_VERSION', defaultValue: '', type: 'string' },
        { name: 'Accept EULA', description: 'Must be TRUE to run', envVar: 'EULA', defaultValue: 'TRUE', type: 'boolean' }
    ], requiredOs: 'linux' },
    { id: 'minecraft-fabric', name: 'Minecraft (Fabric)', type: 'mc-fabric', category: 'game', dockerImage: 'itzg/minecraft-server:latest', defaultPort: 25565, defaultEnv: ["TYPE=FABRIC", "MEMORY=4G", "EULA=TRUE"], configFile: 'server.properties', icon: '🧵', banner: '/banners/mc.jpg', description: 'Modded Minecraft with Fabric.', variables: [
        { name: 'Accept EULA', description: 'Must be TRUE to run', envVar: 'EULA', defaultValue: 'TRUE', type: 'boolean' }
    ], requiredOs: 'linux' },
    { id: 'fctr', name: 'Factorio', type: 'fctr', category: 'game', dockerImage: 'gameservermanagers/gameserver:fctr', defaultPort: 34197, defaultEnv: [], configFile: 'serverfiles/config/server-settings.json', icon: '⚙️', banner: '/banners/fctr.jpg', description: 'Factory building.', variables: [], requiredOs: 'linux' },
    { id: 'sf', name: 'Satisfactory', type: 'sf', category: 'game', dockerImage: 'gameservermanagers/gameserver:sf', defaultPort: 7777, defaultEnv: [], configFile: 'serverfiles/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini', icon: '🏭', banner: '/banners/sf.jpg', description: 'Factory sim.', variables: [], requiredOs: 'linux' },
    { id: 'vh', name: 'Valheim', type: 'vh', category: 'game', dockerImage: 'hostmachine/game-valheim:latest', defaultPort: 2456, defaultEnv: ["WORLD_NAME=Dedicated", "SERVER_NAME=HostMachine Valheim", "PASSWORD=hostmachine", "PUBLIC=1"], configFile: 'adminlist.txt', icon: '🌲', banner: '/banners/vh.jpg', description: 'Viking survival.', variables: [
        { name: 'Server Name', description: 'Name in server browser', envVar: 'SERVER_NAME', defaultValue: 'HostMachine Valheim', type: 'string' },
        { name: 'World Name', description: 'Name of the save file', envVar: 'WORLD_NAME', defaultValue: 'Dedicated', type: 'string' },
        { name: 'Server Password', description: 'REQUIRED: Minimum 5 characters', envVar: 'PASSWORD', defaultValue: 'hostmachine', type: 'string' },
        { name: 'Public', description: 'Show in server browser (1=Yes, 0=No)', envVar: 'PUBLIC', defaultValue: '1', type: 'enum', options: ['0', '1'] }
    ], requiredOs: 'linux' },
    { id: 'ark', name: 'ARK: Survival Evolved', type: 'ark', category: 'game', dockerImage: 'hostmachine/game-ark-evolved:latest', defaultPort: 7777, defaultEnv: ["SERVER_NAME=ARK-ASE", "MAX_PLAYERS=70", "MAP=TheIsland"], configFile: 'ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini', icon: '🦕', banner: '/banners/ark.jpg', description: 'Classic dino survival.', variables: [
        { name: 'Session Name', description: 'Public name', envVar: 'SERVER_NAME', defaultValue: 'ARK-ASE', type: 'string' },
        { name: 'Map Name', description: 'Active world map', envVar: 'MAP', defaultValue: 'TheIsland', type: 'enum', options: ['TheIsland', 'ScorchedEarth', 'Aberration', 'Extinction', 'Genesis', 'Ragnarok', 'Valguero', 'CrystalIsles', 'TheCenter', 'LostIsland', 'Fjordur'] },
        { name: 'Server Password', description: 'Optional join pass', envVar: 'PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Admin Password', description: 'Cheat console pass', envVar: 'ADMIN_PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Max Players', description: 'Max 70 recommended', envVar: 'MAX_PLAYERS', defaultValue: '70', type: 'number' }
    ], requiredOs: 'linux' },
    { id: 'asa', name: 'ARK: Survival Ascended', type: 'asa', category: 'game', dockerImage: 'hostmachine/game-ark-ascended:latest', defaultPort: 7777, defaultEnv: ["SERVER_NAME=ARK-ASA", "MAX_PLAYERS=70", "MAP=TheIsland_WP"], configFile: 'ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini', icon: '🦕', banner: '/banners/ark.jpg', description: 'UE5 Remastered survival.', variables: [
        { name: 'Session Name', description: 'Public name', envVar: 'SERVER_NAME', defaultValue: 'ARK-ASA', type: 'string' },
        { name: 'Map Name', description: 'Active world map', envVar: 'MAP', defaultValue: 'TheIsland_WP', type: 'enum', options: ['TheIsland_WP', 'ScorchedEarth_WP', 'Aberration_WP'] },
        { name: 'Server Password', description: 'Optional join pass', envVar: 'PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Admin Password', description: 'Cheat console pass', envVar: 'ADMIN_PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Max Players', description: 'Max 70 recommended', envVar: 'MAX_PLAYERS', defaultValue: '70', type: 'number' }
    ], requiredOs: 'linux' },
    { id: 'asa-win', name: 'ARK: Ascended (Windows Native)', type: 'asa', category: 'game', dockerImage: 'hostmachine/game-ark-ascended-win:latest', defaultPort: 7777, defaultEnv: ["SERVER_NAME=ARK-ASA-WIN", "MAX_PLAYERS=70"], configFile: 'ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini', icon: '🪟', banner: '/banners/ark.jpg', description: 'Headless Windows Server Core build.', variables: [
        { name: 'Session Name', description: 'Public name', envVar: 'SERVER_NAME', defaultValue: 'ARK-ASA-WIN', type: 'string' },
        { name: 'Server Password', description: 'Optional join pass', envVar: 'PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Admin Password', description: 'Cheat console pass', envVar: 'ADMIN_PASSWORD', defaultValue: '', type: 'string' },
        { name: 'Max Players', description: 'Max 70 recommended', envVar: 'MAX_PLAYERS', defaultValue: '70', type: 'number' }
    ], requiredOs: 'windows' },
    { id: 'pw', name: 'Palworld', type: 'pw', category: 'game', dockerImage: 'gameservermanagers/gameserver:pw', defaultPort: 8211, defaultEnv: [], configFile: 'Pal/Saved/Config/LinuxServer/PalWorldSettings.ini', icon: '🐾', banner: '/banners/pw.jpg', description: 'Monster survival.', variables: [], requiredOs: 'linux' },
    { id: 'terraria', name: 'Terraria', type: 'terraria', category: 'game', dockerImage: 'hostmachine/game-terraria:latest', defaultPort: 7777, defaultEnv: ["MAX_PLAYERS=16", "WORLD_NAME=HostMachine"], configFile: 'serverconfig.txt', icon: '🌳', banner: '/banners/terraria.jpg', description: 'Native Terraria core.', variables: [
        { name: 'Max Players', description: 'Slot count', envVar: 'MAX_PLAYERS', defaultValue: '16', type: 'number' },
        { name: 'World Name', description: 'Name of the world file', envVar: 'WORLD_NAME', defaultValue: 'HostMachine', type: 'string' },
        { name: 'Server Password', description: 'Leave empty for none', envVar: 'PASSWORD', defaultValue: '', type: 'string' }
    ], requiredOs: 'linux' },
    { id: 'sdtd', name: '7 Days to Die', type: 'sdtd', category: 'game', dockerImage: 'hostmachine/game-sdtd:latest', defaultPort: 26900, defaultEnv: ["SERVER_NAME=HostMachine 7D2D", "WORLD_SIZE=4096", "GAME_MODE=GameModeSurvival", "DIFFICULTY=2"], configFile: 'serverconfig.xml', icon: '🧟', banner: '/banners/sdtd.jpg', description: 'Survival horde.', variables: [
        { name: 'Server Name', description: 'Visible name', envVar: 'SERVER_NAME', defaultValue: 'HostMachine 7D2D', type: 'string' },
        { name: 'World Size', description: '4096, 8192, etc.', envVar: 'WORLD_SIZE', defaultValue: '4096', type: 'number' },
        { name: 'Game Mode', description: 'GameModeSurvival', envVar: 'GAME_MODE', defaultValue: 'GameModeSurvival', type: 'string' },
        { name: 'Difficulty', description: '0-5 (0 is easiest)', envVar: 'DIFFICULTY', defaultValue: '2', type: 'number' }
    ], requiredOs: 'linux' },
    { id: 'arma3', name: 'ARMA 3', type: 'arma3', category: 'game', dockerImage: 'gameservermanagers/gameserver:arma3', defaultPort: 2302, defaultEnv: [], configFile: 'serverfiles/arma3.cfg', icon: '🎖️', banner: '/banners/arma3.jpg', description: 'Military sim.', variables: [], requiredOs: 'linux' },
    { id: 'dayz', name: 'DayZ', type: 'dayz', category: 'game', dockerImage: 'gameservermanagers/gameserver:dayz', defaultPort: 2302, defaultEnv: [], configFile: 'serverfiles/cfg/server.cfg', icon: '🧟', banner: '/banners/dayz.jpg', description: 'Hardcore survival.', variables: [], requiredOs: 'linux' },

    { id: 'ts3', name: 'Teamspeak 3', type: 'voip', category: 'voip', dockerImage: 'teamspeak:latest', defaultPort: 9987, defaultEnv: ["TS3SERVER_LICENSE=accept"], configFile: 'ts3server.ini', icon: '🎙️', banner: '/banners/ts3.jpg', description: 'Pro voice chat.', variables: [], requiredOs: 'linux' },
    { id: 'mumble', name: 'Mumble (Murmur)', type: 'voip', category: 'voip', dockerImage: 'mumblevoip/mumble-server:latest', defaultPort: 64738, defaultEnv: [], configFile: 'mumble-server.ini', icon: '📻', banner: '/banners/mumble.jpg', description: 'Low-latency VOIP.', variables: [], requiredOs: 'linux' },

    { id: 'nginx', name: 'Nginx Web Server', type: 'web', category: 'web', dockerImage: 'nginx:latest', defaultPort: 80, defaultEnv: [], configFile: 'nginx.conf', icon: '🌐', banner: '/banners/nginx.jpg', description: 'High-perf web server.', variables: [], requiredOs: 'linux' },
    { id: 'nodejs', name: 'Node.js Runtime', type: 'web', category: 'web', dockerImage: 'node:latest', defaultPort: 3000, defaultEnv: [], configFile: 'package.json', icon: '🟢', banner: '/banners/nodejs.jpg', description: 'JS app hosting.', variables: [], requiredOs: 'linux' },
    { id: 'ghost', name: 'Ghost Blog', type: 'web', category: 'web', dockerImage: 'ghost:latest', defaultPort: 2368, defaultEnv: [], configFile: 'config.production.json', icon: '👻', banner: '/banners/ghost.jpg', description: 'Modern publishing.', variables: [], requiredOs: 'linux' },
    { id: 'wordpress', name: 'WordPress Site', type: 'web', category: 'web', dockerImage: 'wordpress:latest', defaultPort: 80, defaultEnv: [], configFile: 'wp-config.php', icon: '📝', banner: '/banners/wordpress.jpg', description: 'Classic CMS.', variables: [], requiredOs: 'linux' }
  ];

  findAll() {
    return this.games;
  }

  findOne(id: string) {
    return this.games.find(g => g.id === id);
  }
}

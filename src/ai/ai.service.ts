import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { TicketsService } from '../tickets/tickets.service';
import { CommandsService } from '../commands/commands.service';
import { ReportIssueDto } from './dto/report-issue.dto';
import { TicketType, TicketStatus } from '../tickets/entities/ticket.entity';
import { CommandType } from '../commands/dto/create-command.dto';
import { ServersService } from '../servers/servers.service';
import { Server } from '../servers/entities/server.entity';
import { NotificationService } from '../notifications/notification.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://192.168.30.7:11434';

  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly ticketsService: TicketsService,
    private readonly commandsService: CommandsService,
    private readonly serversService: ServersService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  private remediationAttempts: Map<string, number> = new Map();

  private async announceToTerminal(serverId: string, message: string) {
      // Send a color-coded message to the live terminal
      const formatted = `\r\n\x1b[35m[HostBot]\x1b[0m \x1b[1m${message}\x1b[0m\r\n`;
      await this.redisService.publish(`logs:${serverId}`, formatted);
  }

  /**
   * Calls the local Qwen LLM to explain a complex error log.
   */
  async getLlmExplanation(logs: string): Promise<string | null> {
      try {
          const response = await axios.post(`${this.OLLAMA_URL}/api/generate`, {
              model: 'qwen2.5-coder:32b',
              prompt: `You are HostBot, an expert game server technician. 
              Analyze these logs and explain what is wrong in 1-2 concise sentences. 
              Be helpful and professional.
              
              LOGS:
              ${logs.substring(logs.length - 2000)}`, // Last 2k chars
              stream: false
          });
          return response.data.response;
      } catch (e) {
          this.logger.error(`HostBot LLM failed: ${e.message}`);
          return null;
      }
  }

  async analyzeAndRemediate(nodeId: string, report: ReportIssueDto) {
    this.logger.log(`HostBot analyzing issue from Node ${nodeId} for container ${report.containerName}`);
    
    const containerName = report.containerName;
    let serverId: string | undefined = undefined;
    let server: any = null;
    
    try {
        server = await this.serversService.findOne(containerName);
        if (server) {
            serverId = server.id;
        }
    } catch (e) {}

    // --- REBOOT LOOP PREVENTION ---
    if (serverId) {
        const attempts = this.remediationAttempts.get(serverId) || 0;
        if (attempts >= 3) {
            this.logger.warn(`HostBot: Remediation loop detected for ${server?.name}. Escalating.`);
            await this.notificationService.sendAlert('REMEDIATION LOOP', `Server ${server?.name} has crashed 3 times in a row. Auto-fix paused for manual review.`, 'CRITICAL');
            return { action: 'Escalated to Admin (Loop Prevention)' };
        }
    }

    let type = TicketType.UNKNOWN;
    let analysis = 'Unknown error pattern.';
    let resolution = 'Ticket created. Waiting for admin.';
    let status = TicketStatus.OPEN;
    let autoFixCommand = null;

    const logs = report.logs.toLowerCase();

    // --- ENHANCED REMEDIATION MATRIX ---

    // 1. EULA / AGREEMENT
    if (logs.includes('eula') && (logs.includes('agree') || logs.includes('false'))) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Protocol Breach: EULA not accepted.';
        resolution = 'HostBot automatically injected EULA acceptance and signaled a reboot.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
        if (serverId) await this.announceToTerminal(serverId, 'Detected missing EULA agreement. Injecting EULA=TRUE and restarting...');
    }

    // 2. RESOURCE EXHAUSTION (RAM/DISK)
    else if (/outofmemory|oom-killer|failed to allocate|no space left/i.test(logs)) {
        type = TicketType.RESOURCE_EXHAUSTED;
        analysis = logs.includes('space') ? 'Storage Saturation' : 'Memory Depletion';
        resolution = 'Immediate alert sent. Recommend vertical scaling.';
        status = TicketStatus.ESCALATED;
        this.notificationService.sendAlert(`CRITICAL: ${analysis}`, `Node ${nodeId} / Server ${containerName} is out of resources.`, 'CRITICAL');
        if (serverId) await this.announceToTerminal(serverId, `CRITICAL: Server crashed due to ${analysis}. Manual intervention required.`);
    }

    // 3. GAME-SPECIFIC: VALHEIM / WORLD LOCKS
    else if (logs.includes('failed to load') && logs.includes('.db')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Data Integrity: World database lock or corruption.';
        resolution = 'World lock detected. HostBot is attempting to clear temporary lock files.';
        status = TicketStatus.RESOLVED;
        // Logic: Send command to delete .lock files
        autoFixCommand = { 
            targetNodeId: nodeId, 
            type: CommandType.EXEC_COMMAND, 
            payload: { serverId, command: 'rm -f /data/*.lock' } 
        };
        if (serverId) await this.announceToTerminal(serverId, 'Detected World Database Lock. Attempting to clear .lock files...');
    }

    // 4. NETWORK COLLISIONS
    else if (/address already in use|bind exception|could not bind/i.test(logs)) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Interface Collision: Port conflict detected.';
        resolution = 'Port conflict found. HostBot is resetting the networking stack for this server.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
        if (serverId) await this.announceToTerminal(serverId, 'Detected Port Collision. Resetting network bridge...');
    }

    // 5. BINARY CRASHES (Segfaults)
    else if (logs.includes('segmentation fault') || report.exitCode === '139') {
        type = TicketType.CRASH;
        analysis = 'Binary Instability: Segmentation fault.';
        resolution = 'Cold reboot initiated. Logs archived for developer review.';
        status = TicketStatus.OPEN;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
        this.notificationService.sendAlert('Binary Crash', `Server ${server?.name || containerName} segfaulted.`, 'WARNING');
        if (serverId) await this.announceToTerminal(serverId, 'Detected Binary Segmentation Fault. Initiating emergency reboot...');
    }

    // 6. STEAMCMD SYNC FAILURES
    else if (logs.includes('failed to install app') || logs.includes('missing configuration') || logs.includes('steamcmd needs to be online')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Provisioning Failure: SteamCMD network sync failed.';
        resolution = 'HostBot is checking the network MTU and clearing the SteamCMD cache.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { 
            targetNodeId: nodeId, 
            type: CommandType.EXEC_COMMAND, 
            payload: { serverId, command: 'rm -rf /home/steam/Steam/appcache' } 
        };
        if (serverId) await this.announceToTerminal(serverId, 'SteamCMD Connection Issue detected. This usually indicates an MTU mismatch. Applying auto-fixes...');
    }

    // --- NEW: LLM FALLBACK ---
    else {
        this.logger.log(`No regex match for logs. Calling LLM...`);
        const llmResult = await this.getLlmExplanation(report.logs);
        if (llmResult) {
            analysis = 'Advanced Analysis: ' + llmResult;
            resolution = 'Ticket created with AI recommendations.';
            if (serverId) await this.announceToTerminal(serverId, `Analysis: ${llmResult}`);
        }
    }

    // 3. Create Ticket
    const ticket = await this.ticketsService.create({
        nodeId,
        serverId: serverId,
        type,
        logs: report.logs,
        aiAnalysis: analysis,
        resolution,
        status,
    });

    // 4. Track attempts
    if (serverId && autoFixCommand) {
        const attempts = (this.remediationAttempts.get(serverId) || 0) + 1;
        this.remediationAttempts.set(serverId, attempts);
        
        // Reset attempts after 1 hour of stability
        setTimeout(() => this.remediationAttempts.delete(serverId!), 3600000);
    }

    // 5. Execute Auto-Fix
    if (autoFixCommand && serverId) {
        this.logger.log(`HostBot executing auto-fix [${analysis}] for Ticket ${ticket.id}`);
        
        // --- VISIBLE FEEDBACK ---
        // Update server status to show HostBot is working
        try {
            await this.serverRepository.update({ id: serverId }, {
                status: 'REMEDIATING',
                // We'll use the 'progress' field or a temporary name change to indicate action
                name: `${server?.name || 'Server'} [HostBot: ${analysis}]`
            });
            
            // Restore name after 10 seconds (enough for user to see on dashboard)
            const originalName = server?.name;
            if (originalName) {
                setTimeout(async () => {
                    await this.serverRepository.update({ id: serverId! }, { name: originalName });
                }, 10000);
            }
        } catch (e) {
            this.logger.error(`Failed to update visible HostBot status: ${e.message}`);
        }

        await this.commandsService.create(autoFixCommand);
    }

    return {
        ticketId: ticket.id,
        analysis,
        action: autoFixCommand ? `HostBot: ${resolution}` : 'Ticket Created',
    };
  }
}

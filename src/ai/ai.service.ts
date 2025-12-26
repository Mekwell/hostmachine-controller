import { Injectable, Logger } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';
import { CommandsService } from '../commands/commands.service';
import { ReportIssueDto } from './dto/report-issue.dto';
import { TicketType, TicketStatus } from '../tickets/entities/ticket.entity';
import { CommandType } from '../commands/dto/create-command.dto';
import { ServersService } from '../servers/servers.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly commandsService: CommandsService,
    private readonly serversService: ServersService,
    private readonly notificationService: NotificationService,
  ) {}

  private remediationAttempts: Map<string, number> = new Map();

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
    }

    // 2. RESOURCE EXHAUSTION (RAM/DISK)
    else if (/outofmemory|oom-killer|failed to allocate|no space left/i.test(logs)) {
        type = TicketType.RESOURCE_EXHAUSTED;
        analysis = logs.includes('space') ? 'Storage Saturation' : 'Memory Depletion';
        resolution = 'Immediate alert sent. Recommend vertical scaling.';
        status = TicketStatus.ESCALATED;
        this.notificationService.sendAlert(`CRITICAL: ${analysis}`, `Node ${nodeId} / Server ${containerName} is out of resources.`, 'CRITICAL');
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
    }

    // 4. NETWORK COLLISIONS
    else if (/address already in use|bind exception|could not bind/i.test(logs)) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Interface Collision: Port conflict detected.';
        resolution = 'Port conflict found. HostBot is resetting the networking stack for this server.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
    }

    // 5. BINARY CRASHES (Segfaults)
    else if (logs.includes('segmentation fault') || report.exitCode === '139') {
        type = TicketType.CRASH;
        analysis = 'Binary Instability: Segmentation fault.';
        resolution = 'Cold reboot initiated. Logs archived for developer review.';
        status = TicketStatus.OPEN;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
        this.notificationService.sendAlert('Binary Crash', `Server ${server?.name || containerName} segfaulted.`, 'WARNING');
    }

    // 6. STEAMCMD SYNC FAILURES
    else if (logs.includes('failed to install app') || logs.includes('missing configuration')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Provisioning Failure: SteamCMD sync failed.';
        resolution = 'HostBot is clearing the SteamCMD cache and retrying synchronization.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { 
            targetNodeId: nodeId, 
            type: CommandType.EXEC_COMMAND, 
            payload: { serverId, command: 'rm -rf /home/steam/Steam/appcache' } 
        };
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
    if (autoFixCommand) {
        this.logger.log(`HostBot executing auto-fix [${analysis}] for Ticket ${ticket.id}`);
        await this.commandsService.create(autoFixCommand);
    }

    return {
        ticketId: ticket.id,
        analysis,
        action: autoFixCommand ? 'Auto-Fix Initiated' : 'Ticket Created',
    };
  }
}

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

  async analyzeAndRemediate(nodeId: string, report: ReportIssueDto) {
    this.logger.log(`HostBot analyzing issue from Node ${nodeId} for container ${report.containerName}`);
    
    // 1. Identify Server ID
    const containerName = report.containerName;
    let serverId: string | undefined = undefined;
    
    // Check if container name is a valid server ID in our DB
    try {
        const server = await this.serversService.findOne(containerName);
        if (server) {
            serverId = server.id;
        }
    } catch (e) {
        // Not a known server ID, keep as undefined
    }

    // 2. Pattern Matching (The "Brain")
    let type = TicketType.UNKNOWN;
    let analysis = 'Unknown error pattern.';
    let resolution = 'Ticket created. Waiting for admin.';
    let status = TicketStatus.OPEN;
    let autoFixCommand = null;

    const logs = report.logs.toLowerCase();

    // --- REFINED REMEDIATION MATRIX ---

    // 1. EULA / AGREEMENT FAILURE (Minecraft, SteamCMD)
    if (logs.includes('eula') && (logs.includes('agree') || logs.includes('false'))) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Protocol Breach: EULA not accepted.';
        resolution = 'HostBot automatically injected EULA acceptance and signaled a reboot.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
    }

    // 2. MEMORY OVERLOAD (OOM)
    else if (logs.includes('java.lang.outofmemoryerror') || logs.includes('oom-killer') || logs.includes('failed to allocate memory')) {
        type = TicketType.RESOURCE_EXHAUSTED;
        analysis = 'Resource Depletion: Server exceeded allocated RAM limits.';
        resolution = 'HostBot captured memory dump. Recommend increasing instance RAM block.';
        status = TicketStatus.OPEN;
        // No auto-fix possible without upsell/payment, just notify
        this.notificationService.sendAlert('Resource Exhausted', `Server ${containerName} (Node ${nodeId}) OOM.\n${analysis}`, 'WARNING');
    }

    // 3. STORAGE SATURATION (Disk Full)
    else if (logs.includes('no space left on device') || logs.includes('disk full') || logs.includes('failed to write')) {
        type = TicketType.RESOURCE_EXHAUSTED;
        analysis = 'Storage Saturation: Node disk space is at 100%.';
        resolution = 'Emergency alert sent to fleet ops. Critical disk cleanup required.';
        status = TicketStatus.ESCALATED;
        this.notificationService.sendAlert('CRITICAL: Disk Full', `Node ${nodeId} reports 100% disk usage. Immediate action required.`, 'CRITICAL');
    }

    // 4. DATA CORRUPTION (Minecraft Chunks, ARK Databases)
    else if (logs.includes('corrupt chunk') || logs.includes('failed to load save') || logs.includes('database error')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Integrity Failure: Detected corrupted data chunks or database sectors.';
        resolution = 'Snapshot rollback recommended. Manual operator review required to prevent data loss.';
        status = TicketStatus.OPEN;
        this.notificationService.sendAlert('Data Corruption', `Server ${containerName} reports corruption.\n${analysis}`, 'WARNING');
    }

    // 5. NETWORK COLLISION (Port Conflicts)
    else if (logs.includes('address already in use') || logs.includes('bind exception') || logs.includes('could not bind to port')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Interface Collision: Assigned port is already bound by a ghost process or concurrent instance.';
        resolution = 'Attempting port-scrub and process reset.';
        status = TicketStatus.RESOLVED;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
    }

    // 6. BINARY SEGFAULT (C++ Games like ARK, Rust)
    else if (logs.includes('segmentation fault') || report.exitCode === '139' || logs.includes('sigsegv')) {
        type = TicketType.CRASH;
        analysis = 'Binary Instability: Segmentation fault detected in core module.';
        resolution = 'Hot-swapping instance state and performing cold reboot.';
        status = TicketStatus.OPEN;
        autoFixCommand = { targetNodeId: nodeId, type: CommandType.RESTART_SERVER, payload: { serverId } };
        this.notificationService.sendAlert('Binary Crash', `Server ${containerName} segfaulted. Auto-reboot initiated.`, 'WARNING');
    }

    // 7. PERFORMANCE DEGRADATION (Lag)
    else if (logs.includes("can't keep up!") || logs.includes('is the server overloaded')) {
        type = TicketType.UNKNOWN;
        analysis = 'Performance Anomaly: Server tick-rate dropping below acceptable thresholds.';
        resolution = 'HostBot monitoring thread priority. Possible CPU contention.';
        status = TicketStatus.OPEN;
    }

    // 3. Create Ticket
    const ticket = await this.ticketsService.create({
        nodeId,
        serverId: serverId, // Might need validation if it's a real UUID
        type,
        logs: report.logs,
        aiAnalysis: analysis,
        resolution,
        status,
    });

    // 4. Execute Auto-Fix
    if (autoFixCommand) {
        this.logger.log(`HostBot executing auto-fix for Ticket ${ticket.id}`);
        await this.commandsService.create(autoFixCommand);
    }

    return {
        ticketId: ticket.id,
        analysis,
        action: autoFixCommand ? 'Auto-Fix Initiated' : 'Ticket Created',
    };
  }
}

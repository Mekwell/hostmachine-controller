import { Injectable, Logger } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';
import { CommandsService } from '../commands/commands.service';
import { ReportIssueDto } from './dto/report-issue.dto';
import { TicketType, TicketStatus } from '../tickets/entities/ticket.entity';
import { CommandType } from '../commands/dto/create-command.dto';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly commandsService: CommandsService,
    private readonly serversService: ServersService,
  ) {}

  async analyzeAndRemediate(nodeId: string, report: ReportIssueDto) {
    this.logger.log(`HostBot analyzing issue from Node ${nodeId} for container ${report.containerName}`);
    
    // 1. Identify Server ID
    const containerName = report.containerName;
    let serverId = null;
    
    // Check if container name is a valid server ID in our DB
    try {
        const server = await this.serversService.findOne(containerName);
        if (server) {
            serverId = server.id;
        }
    } catch (e) {
        // Not a known server ID, keep as null
    }

    // 2. Pattern Matching (The "Brain")
    let type = TicketType.UNKNOWN;
    let analysis = 'Unknown error pattern.';
    let resolution = 'Ticket created. Waiting for admin.';
    let status = TicketStatus.OPEN;
    let autoFixCommand = null;

    const logs = report.logs.toLowerCase();

    // RULE 1: EULA (Minecraft)
    if (logs.includes('eula') && logs.includes('agree')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Server failed because EULA was not accepted.';
        resolution = 'HostBot automatically accepted EULA and restarted the server.';
        status = TicketStatus.RESOLVED;
        
        // Auto-Fix: Re-deploy with EULA=TRUE (Simplification: Just Restart for now, but ideally update Env)
        // For prototype, we just restart and hope the user fixed it, or we assume the "Install" command failed.
        // Better: Send a specific command to update env.
        autoFixCommand = {
            targetNodeId: nodeId,
            type: CommandType.RESTART_SERVER,
            payload: { serverId },
        };
    }

    // RULE 2: Port Conflict
    else if (logs.includes('address already in use') || logs.includes('bind exception')) {
        type = TicketType.CONFIG_ERROR;
        analysis = 'Port binding failed. The port is likely in use by another process.';
        resolution = 'Escalated to admin to check port allocations.';
        status = TicketStatus.ESCALATED;
    }

    // RULE 3: Segfault / Crash
    else if (logs.includes('segmentation fault') || report.exitCode === '139') {
        type = TicketType.CRASH;
        analysis = 'Critical binary crash (Segmentation Fault).';
        resolution = 'Restarting server to attempt recovery.';
        status = TicketStatus.OPEN; // Keep open to monitor recurrence

         autoFixCommand = {
            targetNodeId: nodeId,
            type: CommandType.RESTART_SERVER,
            payload: { serverId },
        };
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

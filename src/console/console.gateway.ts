import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ConsoleService } from './console.service';

interface LogPayload {
  serverId: string;
  data: string;
}

interface StatsPayload {
  serverId: string;
  stats: any; // Stats structure varies by game engine
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConsoleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConsoleGateway.name);

  constructor(
    @Inject(forwardRef(() => ConsoleService))
    private readonly consoleService: ConsoleService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-server')
  async handleJoinServer(client: Socket, serverId: string) {
    this.logger.log(`Client ${client.id} joining room: server:${serverId}`);
    client.join(`server:${serverId}`);
    
    // Fetch and send log history from local cache
    const history = await this.consoleService.getLogs(serverId);
    if (history && history.length > 0) {
        client.emit('log-history', history);
    }

    return { event: 'joined', data: serverId };
  }

  /**
   * Broadcasts logs to active dashboard sessions.
   * Includes a filter to suppress high-volume engine telemetry (GameAnalytics).
   */
  @SubscribeMessage('log-push')
  handleLogPush(client: Socket, payload: LogPayload) {
      // --- FILTER LOG NOISE ---
      // We drop these specific engine-level logs to prevent flooding the user's browser
      if (payload.data && (
          /GameAnalytics/i.test(payload.data) || 
          /Event queue: No events to send/i.test(payload.data)
      )) return;
      // ------------------------

      // Broadcast to all clients in the server-specific room
      this.server.to(`server:${payload.serverId}`).emit('log', payload.data);
  }

  @SubscribeMessage('stats-push')
  handleStatsPush(client: Socket, payload: StatsPayload) {
      this.server.to(`server:${payload.serverId}`).emit('stats', payload.stats);
  }
}

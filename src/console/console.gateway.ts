import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ConsoleService } from './console.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'console',
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
  handleJoinServer(client: Socket, serverId: string) {
    this.logger.log(`Client ${client.id} joining room: server:${serverId}`);
    client.join(`server:${serverId}`);
    return { event: 'joined', data: serverId };
  }

  @SubscribeMessage('log-push')
  handleLogPush(client: Socket, payload: { serverId: string, data: string }) {
      // Broadcast to all clients watching this server
      this.server.to(`server:${payload.serverId}`).emit('log', payload.data);
  }

  @SubscribeMessage('stats-push')
  handleStatsPush(client: Socket, payload: { serverId: string, stats: any }) {
      this.server.to(`server:${payload.serverId}`).emit('stats', payload.stats);
  }
}

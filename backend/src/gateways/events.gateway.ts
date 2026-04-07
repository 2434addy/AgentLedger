import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

const wsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

@WebSocketGateway({
  cors: {
    origin: wsOrigin,
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Only accept token from auth object or Authorization header (not query string — leaks in logs)
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string; orgId: string; exp: number }>(token);
      const { sub, orgId, exp } = payload;

      if (!orgId || !sub) {
        client.disconnect();
        return;
      }

      await client.join(`org:${orgId}`);
      client.data.orgId = orgId;
      client.data.userId = sub;
      this.logger.log(`Client ${client.id} joined room org:${orgId}`);

      // Auto-disconnect when the JWT expires
      if (exp) {
        const expiresInMs = exp * 1000 - Date.now();
        if (expiresInMs > 0) {
          setTimeout(() => {
            this.logger.log(`Client ${client.id} disconnected: token expired`);
            client.disconnect();
          }, expiresInMs);
        } else {
          client.disconnect();
        }
      }
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  emitEventsCreated(orgId: string, events: Record<string, unknown>[]) {
    this.server.to(`org:${orgId}`).emit('events:created', events);
  }

  emitApprovalCreated(orgId: string, approval: Record<string, unknown>) {
    this.server.to(`org:${orgId}`).emit('approval:created', approval);
  }
}

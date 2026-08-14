import type { WebSocket } from 'ws';
import { WebSocket as WsWebSocket } from 'ws';
import type { RealtimeEvent } from './event-types.js';
import { logger } from '../utils/logger.js';

/**
 * Tracks connected WebSocket clients and broadcasts events.
 * TODO: Phase 4 — auth per connection, room/channel subscriptions, heartbeat.
 */

interface ManagedClient {
  id: string;
  socket: WebSocket;
  userId?: string;
}

const clients = new Map<string, ManagedClient>();

export function addClient(id: string, socket: WebSocket, userId?: string): void {
  clients.set(id, { id, socket, userId });
  logger.debug('WS client connected', { id, userId, total: clients.size });
}

export function removeClient(id: string): void {
  clients.delete(id);
  logger.debug('WS client disconnected', { id, total: clients.size });
}

export function broadcastToClients(event: RealtimeEvent): void {
  const raw = JSON.stringify(event);

  for (const client of clients.values()) {
    if (client.socket.readyState === WsWebSocket.OPEN) {
      client.socket.send(raw);
    }
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}

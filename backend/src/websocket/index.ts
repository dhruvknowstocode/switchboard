import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { addClient, removeClient } from './connection-manager.js';
import { logger } from '../utils/logger.js';

/** WebSocket server on path `/ws` — fans out Redis Pub/Sub events to dashboards. */
let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: http.Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, _req) => {
    const clientId = randomUUID();
    addClient(clientId, socket);

    socket.send(
      JSON.stringify({
        type: 'SYSTEM_STATUS',
        channel: 'system-events',
        payload: { status: 'connected', clientId },
        timestamp: new Date().toISOString(),
      }),
    );

    socket.on('close', () => {
      removeClient(clientId);
    });

    socket.on('error', (error) => {
      logger.warn('WS client error', { clientId, error: error.message });
      removeClient(clientId);
    });
  });

  logger.info('WebSocket server initialized', { path: '/ws' });
  return wss;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

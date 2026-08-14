import { publishEvent, PUBSUB_CHANNELS } from './pubsub.js';
import { connectRedis } from './client.js';
import {
  createRealtimeEvent,
  type IncidentEventType,
} from '../websocket/event-types.js';

export async function publishIncidentEvent(
  type: IncidentEventType,
  payload: {
    incidentId: string;
    number: string;
    title?: string;
    status?: string;
    severity?: string;
    action?: string;
    flagKey?: string;
    environment?: string;
  },
): Promise<void> {
  try {
    await connectRedis();
  } catch {
    // degraded mode
  }

  const event = createRealtimeEvent(type, PUBSUB_CHANNELS.INCIDENTS, payload);
  await publishEvent(PUBSUB_CHANNELS.INCIDENTS, event);
}

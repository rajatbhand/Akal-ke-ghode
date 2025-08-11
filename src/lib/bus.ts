import type { Server as IOServer } from 'socket.io';
import Pusher from 'pusher';

export type BusEvent =
  | { type: 'state:update' }
  | { type: 'reveal' }
  | { type: 'scores:update' }
  | { type: 'audience:update' };

// Throttle events to prevent spam
const eventThrottle = new Map<string, number>();
const THROTTLE_MS = 100; // Minimum 100ms between same event types

export function emitBus(event: BusEvent) {
  // Throttle repeated events
  const now = Date.now();
  const lastEmit = eventThrottle.get(event.type) || 0;
  if (now - lastEmit < THROTTLE_MS) {
    return; // Skip this event to reduce spam
  }
  eventThrottle.set(event.type, now);

  const io: IOServer | undefined = (globalThis as any).io;
  try {
    io?.emit(event.type, event);
  } catch {}

  // Also broadcast via Pusher if configured (for production)
  try {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;
    if (appId && key && secret && cluster) {
      const globalAny = globalThis as any;
      if (!globalAny.__pusher) {
        globalAny.__pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
      }
      globalAny.__pusher.trigger('show', event.type, event);
    }
  } catch {}
}



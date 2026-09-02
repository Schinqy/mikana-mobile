/**
 * WhatsApp Relay Client
 *
 * Connects mobile app to the Baileys relay server via WebSocket.
 * Handles:
 * - Real QR code streaming for WhatsApp pairing
 * - Connection status events
 * - Incoming lead notifications
 * - Outbound quote dispatch
 */



import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PRODUCTION_RELAY_URL = 'https://mikana-relay.onrender.com';

/**
 * Resolves the relay URL for the current environment.
 * Default is the live cloud deployment on Render (https://mikana-relay.onrender.com).
 */
export function resolveRelayUrl(inputUrl?: string): string {
  // If no URL or stale localhost / local LAN IP from previous dev sessions, use live Render cloud URL
  if (
    !inputUrl ||
    inputUrl.includes('localhost') ||
    inputUrl.includes('127.0.0.1') ||
    inputUrl.includes('10.') ||
    inputUrl.includes('192.168.')
  ) {
    return PRODUCTION_RELAY_URL;
  }
  return inputUrl.trim().replace(/\/$/, '');
}

type RelayEventHandler = {
  onQR?: (qr: string) => void;
  onConnected?: (phone: string) => void;
  onDisconnected?: (reason: string) => void;
  onNewLead?: (lead: any) => void;
  onError?: (message: string) => void;
  onStatus?: (status: string, phone?: string) => void;
};

class WhatsAppRelayClient {
  private ws: WebSocket | null = null;
  private relayUrl: string = '';
  private sessionId: string = '';
  private handlers: RelayEventHandler = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose = false;

  /**
   * Connect to the relay server WebSocket
   */
  connect(relayUrl: string, sessionId: string, handlers: RelayEventHandler) {
    const resolvedUrl = resolveRelayUrl(relayUrl);
    this.relayUrl = resolvedUrl;
    this.sessionId = sessionId;
    this.handlers = handlers;
    this.isIntentionalClose = false;

    // Clean up any existing connection and timers first
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }

    const wsUrl = resolvedUrl.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://') + '/ws';

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({
              type: 'subscribe',
              sessionId: this.sessionId,
            }));
          } catch (_) {}
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);

          switch (msg.type) {
            case 'qr':
              this.handlers.onQR?.(msg.qr);
              break;
            case 'connected':
              this.handlers.onConnected?.(msg.phone);
              break;
            case 'disconnected':
              this.handlers.onDisconnected?.(msg.reason);
              break;
            case 'new_lead':
              this.handlers.onNewLead?.(msg.lead);
              break;
            case 'error':
              this.handlers.onError?.(msg.message);
              break;
            case 'status':
              this.handlers.onStatus?.(msg.status, msg.phone);
              break;
          }
        } catch {
          // ignore malformed messages
        }
      };

      socket.onclose = () => {
        if (!this.isIntentionalClose && this.ws === socket) {
          // Auto-reconnect after 4 seconds
          this.reconnectTimer = setTimeout(() => {
            this.connect(this.relayUrl, this.sessionId, this.handlers);
          }, 4000);
        }
      };

      socket.onerror = () => {
        // Silently handled by onclose reconnect
      };
    } catch (err) {
      this.handlers.onError?.('Failed to connect to relay server');
    }
  }

  /**
   * Disconnect from the relay server
   */
  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const relayClient = new WhatsAppRelayClient();

// ─── REST API Helpers ────────────────────────────────────────────────────────

/**
 * Create a new WhatsApp session on the relay server
 */
export async function createSession(relayUrl: string, userId: string): Promise<{ sessionId: string; status: string }> {
  const url = resolveRelayUrl(relayUrl);
  const res = await fetch(`${url}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Session creation failed: ${res.status}`);
  return res.json();
}

/**
 * Get session connection status
 */
export async function getSessionStatus(relayUrl: string, sessionId: string): Promise<any> {
  const url = resolveRelayUrl(relayUrl);
  try {
    const res = await fetch(`${url}/api/sessions/${sessionId}/status`);
    if (!res.ok) return { status: 'disconnected', phone: null };
    return res.json();
  } catch (_) {
    return { status: 'disconnected', phone: null };
  }
}

/**
 * Fetch all WhatsApp groups for a session
 */
export async function fetchGroups(relayUrl: string, sessionId: string): Promise<any[]> {
  const url = resolveRelayUrl(relayUrl);
  try {
    const res = await fetch(`${url}/api/sessions/${sessionId}/groups`);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Groups fetch failed: ${res.status}`);
    }
    const data = await res.json();
    return data.groups || [];
  } catch (err) {
    return [];
  }
}

/**
 * Set which groups to monitor for incoming leads
 */
export async function setMonitoredGroups(relayUrl: string, sessionId: string, groupIds: string[]): Promise<void> {
  const url = resolveRelayUrl(relayUrl);
  const res = await fetch(`${url}/api/sessions/${sessionId}/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  });
  if (!res.ok) throw new Error(`Monitor groups failed: ${res.status}`);
}

/**
 * Send a WhatsApp message directly through Baileys (outbound quote)
 */
export async function sendWhatsAppMessage(
  relayUrl: string,
  sessionId: string,
  to: string,
  message: string
): Promise<void> {
  const url = resolveRelayUrl(relayUrl);
  const res = await fetch(`${url}/api/sessions/${sessionId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) throw new Error(`Send failed: ${res.status}`);
}

/**
 * Request real 8-digit WhatsApp pairing code for a phone number.
 * Times out after 25 seconds — server needs up to ~12s to init Baileys + get code.
 */
export async function requestPairingCode(
  relayUrl: string,
  sessionId: string,
  phoneNumber: string
): Promise<{ ok: boolean; code: string }> {
  const url = resolveRelayUrl(relayUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${url}/api/sessions/${sessionId}/pairing-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Pairing code request failed: ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Timed out waiting for pairing code. Make sure your phone number includes the country code.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Disconnect and clean up a session
 */
export async function disconnectSession(relayUrl: string, sessionId: string): Promise<void> {
  const url = resolveRelayUrl(relayUrl);
  await fetch(`${url}/api/sessions/${sessionId}/disconnect`, { method: 'POST' });
}

/**
 * Push compact user capability profile to relay server.
 * Called after connecting so the matching engine has user context.
 */
export interface UserCapabilityProfile {
  displayName: string;
  description: string;
  location: string;
  serviceAreas: string[];
  categories: string[];
  capabilities: string[];
  products: string[];
  keywords: string[];
  autopilot?: {
    enabled: boolean;
    minMatchScore: number;
    requireApproval: boolean;
    maxAutoPerHour: number;
    businessHoursOnly: boolean;
    businessHoursStart: number;
    businessHoursEnd: number;
    neverRespondAboveBudget: number | null;
  };
}

export async function pushCapabilityProfile(
  relayUrl: string,
  sessionId: string,
  profile: UserCapabilityProfile
): Promise<void> {
  const url = resolveRelayUrl(relayUrl);
  try {
    await fetch(`${url}/api/sessions/${sessionId}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch (_) {
    // Non-fatal — matching will use empty profile until next successful push
  }
}

/**
 * Fetch pipeline metrics from relay server
 */
export async function fetchMetrics(relayUrl: string): Promise<any> {
  const url = resolveRelayUrl(relayUrl);
  try {
    const res = await fetch(`${url}/api/metrics`);
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  }
}

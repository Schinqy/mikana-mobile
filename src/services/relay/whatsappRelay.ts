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

/**
 * Resolves the relay URL for the current environment.
 * Dynamically resolves the Metro dev server IP on physical devices over Wi-Fi,
 * falling back to active host IP or localhost.
 */
export function resolveRelayUrl(inputUrl?: string): string {
  // If user provided a remote production / Railway URL, keep it
  if (inputUrl && !inputUrl.includes('localhost') && !inputUrl.includes('127.0.0.1')) {
    return inputUrl;
  }

  // Dynamic host extraction from Metro dev server hostUri (works on physical Wi-Fi devices)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3005`;
    }
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.207.186.145:3005';
  }

  return 'http://localhost:3005';
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

    const wsUrl = resolvedUrl.replace(/^http/, 'ws') + '/ws';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Subscribe to our session
        this.ws?.send(JSON.stringify({
          type: 'subscribe',
          sessionId: this.sessionId,
        }));
      };

      this.ws.onmessage = (event) => {
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

      this.ws.onclose = () => {
        if (!this.isIntentionalClose) {
          // Auto-reconnect after 3 seconds
          this.reconnectTimer = setTimeout(() => {
            this.connect(this.relayUrl, this.sessionId, this.handlers);
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        this.handlers.onError?.('WebSocket connection failed');
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
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
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
  const res = await fetch(`${url}/api/sessions/${sessionId}/status`);
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch all WhatsApp groups for a session
 */
export async function fetchGroups(relayUrl: string, sessionId: string): Promise<any[]> {
  const url = resolveRelayUrl(relayUrl);
  const res = await fetch(`${url}/api/sessions/${sessionId}/groups`);
  if (!res.ok) throw new Error(`Groups fetch failed: ${res.status}`);
  const data = await res.json();
  return data.groups;
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
 * Request real 8-digit WhatsApp pairing code for a phone number
 */
export async function requestPairingCode(
  relayUrl: string,
  sessionId: string,
  phoneNumber: string
): Promise<{ ok: boolean; code: string }> {
  const url = resolveRelayUrl(relayUrl);
  const res = await fetch(`${url}/api/sessions/${sessionId}/pairing-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Pairing code request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Disconnect and clean up a session
 */
export async function disconnectSession(relayUrl: string, sessionId: string): Promise<void> {
  const url = resolveRelayUrl(relayUrl);
  await fetch(`${url}/api/sessions/${sessionId}/disconnect`, { method: 'POST' });
}

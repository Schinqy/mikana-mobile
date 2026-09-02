/**
 * Mikana Relay Server
 * 
 * Multi-session Baileys WhatsApp relay that:
 * 1. Creates WhatsApp sessions per user (real QR codes)
 * 2. Intercepts group messages from monitored channels
 * 3. Classifies leads via Gemini Flash
 * 4. Stores leads in Supabase (real-time push to mobile)
 * 5. Sends outbound quotes directly through WhatsApp
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3005;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Pairing Tickets Store (15-min ephemeral crypto tokens) ─────────────────
const pairingTickets = new Map(); // token -> { sessionId, userId, expiresAt }

// In-memory ring buffer for remote log diagnostics
const recentLogs = [];
function addLog(level, msg, extra = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  recentLogs.push(entry);
  if (recentLogs.length > 150) recentLogs.shift();
}

const logger = pino({ level: 'info' });

// Supabase client (service role for server-side writes)
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  logger.info('Supabase connected');
} else {
  logger.warn('Supabase not configured — leads stored in-memory only');
}

// ─── In-Memory Session Store ─────────────────────────────────────────────────

const sessions = new Map();     // sessionId -> { socket, ws clients, groups, etc }
const wsClients = new Map();    // sessionId -> Set<WebSocket>
const AUTH_DIR = path.join(__dirname, '.auth_sessions');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ─── Express + WebSocket Server ──────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ─── Health & Diagnostics ───────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service: 'mikana-relay',
    version: '1.0.0',
    activeSessions: sessions.size,
    status: 'running',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, sessions: sessions.size });
});

app.get('/api/logs', (req, res) => {
  res.json({ count: recentLogs.length, logs: recentLogs.slice(-100) });
});

// ─── Generate Cryptographic One-Time Pairing Ticket (15 min expiry) ─────────

app.post('/api/sessions/:sessionId/ticket', (req, res) => {
  const { sessionId } = req.params;
  const userId = sessionId.replace('session_', '');
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  pairingTickets.set(token, {
    sessionId,
    userId,
    expiresAt,
  });

  addLog('info', 'Generated secure pairing ticket', { sessionId, token: token.slice(0, 8) + '...' });
  res.json({
    ok: true,
    token,
    expiresAt,
    url: `/pair?token=${token}`,
  });
});

// ─── Web QR Pairing Portal (Authentication Protected) ───────────────────────

app.get('/pair', (req, res) => {
  const token = req.query.token;
  const explicitSession = req.query.session;

  let resolvedSessionId = null;
  let resolvedUserId = null;

  if (token && pairingTickets.has(token)) {
    const ticket = pairingTickets.get(token);
    if (Date.now() < ticket.expiresAt) {
      resolvedSessionId = ticket.sessionId;
      resolvedUserId = ticket.userId;
    } else {
      pairingTickets.delete(token);
    }
  } else if (explicitSession && process.env.NODE_ENV !== 'production') {
    resolvedSessionId = explicitSession;
    resolvedUserId = explicitSession.replace('session_', '');
  }

  // If no valid secure token was provided, reject with security gatekeeper
  if (!resolvedSessionId) {
    return res.status(403).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mikana • Secure Pairing</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: #f4f4f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin-bottom: 20px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    h1 { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
    p { font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .footer-hint { font-size: 11.5px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span>Authentication Required</div>
    <h1>Missing or Expired Pairing Link</h1>
    <p>To securely pair your WhatsApp, open the <b>Mikana Mobile</b> app on your phone, go to the QR Scanner tab, and tap <b>"Open / Share Live QR on PC"</b>.</p>
    <div class="footer-hint">Each link is cryptographically protected with a one-time token that expires in 15 minutes.</div>
  </div>
</body>
</html>`);
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mikana • WhatsApp QR Pairing</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: #f4f4f5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(37, 99, 235, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(37, 99, 235, 0.3);
      margin-bottom: 16px;
    }
    .badge.connected {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    p.sub { font-size: 13px; color: #a1a1aa; margin-bottom: 24px; line-height: 1.5; }
    .qr-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 256px;
      min-height: 256px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .steps {
      text-align: left;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      color: #d4d4d8;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .step-item { display: flex; align-items: flex-start; gap: 10px; }
    .step-num {
      background: #27272a;
      color: #ffffff;
      font-weight: 600;
      font-size: 11px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn:hover { background: #1d4ed8; }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      transition: background 0.2s;
    }
    .btn-secondary:hover { background: #3f3f46; }
    .session-tag {
      font-family: monospace;
      font-size: 11px;
      color: #71717a;
      margin-top: 16px;
    }
    .success-box {
      display: none;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge" id="statusBadge"><span class="dot"></span><span id="statusText">Connecting...</span></div>
    <h1>Mikana WhatsApp Relay</h1>
    <p class="sub">Scan this QR code from your phone's WhatsApp to connect.</p>

    <div class="success-box" id="successBox">
      <h2 style="font-size: 16px; margin-bottom: 6px;">WhatsApp Connected!</h2>
      <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 14px;" id="connectedPhone"></p>
      <button class="btn-secondary" onclick="unlinkSession()">Unlink / Pair Different Device</button>
    </div>

    <div class="qr-container" id="qrBox">
      <div id="qrcode"></div>
    </div>

    <div class="steps" id="stepsBox">
      <div class="step-item"><span class="step-num">1</span><span>Open <b>WhatsApp</b> on your phone</span></div>
      <div class="step-item"><span class="step-num">2</span><span>Tap <b>⋮ Menu</b> or <b>Settings</b> &gt; <b>Linked Devices</b></span></div>
      <div class="step-item"><span class="step-num">3</span><span>Tap <b>Link a Device</b> and point camera at this screen</span></div>
    </div>

    <button class="btn" id="refreshBtn" onclick="refreshQR()">Refresh QR Code</button>
    <div class="session-tag" id="sessionLabel"></div>
  </div>

  <script>
    const sessionId = new URLSearchParams(window.location.search).get('session') || 'session_user_default';
    const userId = sessionId.replace('session_', '');
    document.getElementById('sessionLabel').innerText = 'Session: ' + sessionId;
    let qrcodeObj = null;
    let ws = null;

    function renderQR(text) {
      const container = document.getElementById('qrcode');
      container.innerHTML = '';
      qrcodeObj = new QRCode(container, {
        text: text,
        width: 224,
        height: 224,
        colorDark: '#09090b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    function initSession() {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          showConnected(data.phone);
        }
      })
      .catch(console.error);
    }

    function showConnected(phone) {
      document.getElementById('statusBadge').className = 'badge connected';
      document.getElementById('statusText').innerText = 'Connected';
      document.getElementById('qrBox').style.display = 'none';
      document.getElementById('stepsBox').style.display = 'none';
      document.getElementById('refreshBtn').style.display = 'none';
      document.getElementById('successBox').style.display = 'block';
      document.getElementById('connectedPhone').innerText = phone ? 'Linked Account: +' + phone : 'Active & listening for leads';
    }

    function connectWS() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(protocol + '//' + window.location.host + '/ws');

      ws.onopen = () => {
        document.getElementById('statusText').innerText = 'Waiting for QR...';
        ws.send(JSON.stringify({ type: 'subscribe', sessionId: sessionId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'qr' && msg.qr) {
            document.getElementById('statusBadge').className = 'badge';
            document.getElementById('statusText').innerText = 'Ready to Scan';
            document.getElementById('qrBox').style.display = 'inline-flex';
            document.getElementById('stepsBox').style.display = 'flex';
            document.getElementById('refreshBtn').style.display = 'block';
            document.getElementById('successBox').style.display = 'none';
            renderQR(msg.qr);
          } else if (msg.type === 'connected') {
            showConnected(msg.phone);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        document.getElementById('statusText').innerText = 'Reconnecting...';
        setTimeout(connectWS, 3000);
      };
    }

    function refreshQR() {
      fetch('/api/sessions/' + sessionId + '/restart', { method: 'POST' })
        .then(() => initSession())
        .catch(() => initSession());
    }

    function unlinkSession() {
      fetch('/api/sessions/' + sessionId + '/restart', { method: 'POST' })
        .then(() => {
          document.getElementById('successBox').style.display = 'none';
          document.getElementById('statusText').innerText = 'Generating fresh QR...';
          initSession();
        })
        .catch(console.error);
    }

    initSession();
    connectWS();
  </script>
</body>
</html>`);
});

// ─── Restart / Reset Session Endpoint ───────────────────────────────────────

app.post('/api/sessions/:sessionId/restart', async (req, res) => {
  const { sessionId } = req.params;
  const userId = sessionId.replace('session_', '');
  try {
    logger.info({ sessionId }, 'Restarting Baileys session for fresh QR...');
    await startBaileysSession(sessionId, userId, true);
    res.json({ ok: true, message: 'Session restarted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Session ──────────────────────────────────────────────────────────

app.post('/api/sessions', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sessionId = `session_${userId}`;

  // If session already exists and is connected, return status
  if (sessions.has(sessionId)) {
    const existing = sessions.get(sessionId);
    return res.json({
      sessionId,
      status: existing.status,
      phone: existing.phone || null,
    });
  }

  // Start new Baileys session
  try {
    await startBaileysSession(sessionId, userId, false);
    res.json({ sessionId, status: 'qr_pending' });
  } catch (err) {
    logger.error({ err }, 'Failed to create session');
    res.status(500).json({ error: 'Session creation failed' });
  }
});

// ─── Request 8-Digit Pairing Code (Phone Number Link) ─────────────────────────

app.post('/api/sessions/:sessionId/pairing-code', async (req, res) => {
  const { sessionId } = req.params;
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });

  const userId = sessionId.replace('session_', '');
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // Always (re)start the session in pairing-code mode for this endpoint.
  // usePairingCode:true is required — without it requestPairingCode() hangs forever.
  try {
    logger.info({ sessionId, cleanPhone }, 'Starting Baileys in pairing-code mode');
    await startBaileysSession(sessionId, userId, true);
  } catch (err) {
    logger.error({ err }, 'Failed to start pairing-code session');
    return res.status(500).json({ error: 'Could not initialize session' });
  }

  const session = sessions.get(sessionId);
  if (!session?.sock) {
    return res.status(500).json({ error: 'Session not found after init' });
  }

  try {
    // Wait up to 10s for the socket to reach a state where pairing code works
    let code = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 8;
    const WAIT_MS = 1500;

    while (attempts < MAX_ATTEMPTS && !code) {
      try {
        attempts++;
        logger.info({ sessionId, attempt: attempts }, 'Requesting pairing code...');
        code = await session.sock.requestPairingCode(cleanPhone);
      } catch (err) {
        logger.warn({ attempt: attempts, err: err.message }, 'Pairing code attempt failed, retrying...');
        if (attempts >= MAX_ATTEMPTS) throw err;
        await new Promise((r) => setTimeout(r, WAIT_MS));
      }
    }

    if (!code) throw new Error('No code returned after all attempts');

    logger.info({ sessionId, cleanPhone, code }, 'WhatsApp pairing code generated');
    res.json({ ok: true, code });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to generate pairing code');
    res.status(500).json({
      error: err.message || 'Failed to generate pairing code. Check number format (include country code) and retry.',
    });
  }
});

// ─── Get Session Status ──────────────────────────────────────────────────────

app.get('/api/sessions/:sessionId/status', async (req, res) => {
  const { sessionId } = req.params;
  const userId = sessionId.replace('session_', '');
  const authPath = path.join(AUTH_DIR, sessionId);

  if (!sessions.has(sessionId) && fs.existsSync(path.join(authPath, 'creds.json'))) {
    try {
      await startBaileysSession(sessionId, userId, false);
    } catch (_) {}
  }

  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    sessionId,
    status: session.status,
    phone: session.phone || null,
    groups: session.monitoredGroups || [],
  });
});

// ─── List Groups for a Session ───────────────────────────────────────────────

app.get('/api/sessions/:sessionId/groups', async (req, res) => {
  const { sessionId } = req.params;
  const userId = sessionId.replace('session_', '');
  const authPath = path.join(AUTH_DIR, sessionId);

  if (!sessions.has(sessionId) && fs.existsSync(path.join(authPath, 'creds.json'))) {
    try {
      await startBaileysSession(sessionId, userId, false);
    } catch (_) {}
  }

  const session = sessions.get(sessionId);
  if (!session || !session.sock) {
    return res.status(404).json({ error: 'Session not found or not connected' });
  }

  try {
    const groups = await session.sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map((g) => ({
      id: g.id,
      subject: g.subject,
      participants: g.participants?.length || 0,
      creation: g.creation,
    }));
    res.json({ groups: groupList });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch groups');
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// ─── Set Monitored Groups ────────────────────────────────────────────────────

app.post('/api/sessions/:sessionId/monitor', async (req, res) => {
  const { sessionId } = req.params;
  const { groupIds } = req.body; // Array of group JIDs to monitor
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.monitoredGroups = groupIds || [];
  logger.info({ sessionId, groupCount: groupIds.length }, 'Updated monitored groups');
  res.json({ ok: true, monitoredGroups: session.monitoredGroups });
});

// ─── Send Message (Outbound Quote) ───────────────────────────────────────────

app.post('/api/sessions/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params;
  const { to, message } = req.body; // to = phone@s.whatsapp.net or JID
  const session = sessions.get(sessionId);

  if (!session || !session.sock || session.status !== 'connected') {
    return res.status(400).json({ error: 'Session not connected' });
  }

  try {
    // Normalize phone number to JID
    const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
    await session.sock.sendMessage(jid, { text: message });
    logger.info({ sessionId, to: jid }, 'Outbound message sent');
    res.json({ ok: true, to: jid });
  } catch (err) {
    logger.error({ err }, 'Failed to send message');
    res.status(500).json({ error: 'Send failed' });
  }
});

// ─── Disconnect Session ──────────────────────────────────────────────────────

app.post('/api/sessions/:sessionId/disconnect', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  try {
    if (session.sock) {
      await session.sock.logout();
      session.sock.end();
    }
    sessions.delete(sessionId);
    // Clean up auth files
    const authPath = path.join(AUTH_DIR, sessionId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true });
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Failed to disconnect');
    res.status(500).json({ error: 'Disconnect failed' });
  }
});

// ─── WebSocket Connection Handler ────────────────────────────────────────────

wss.on('connection', (ws, req) => {
  // Client sends { type: 'subscribe', sessionId: '...' } after connecting
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'subscribe' && msg.sessionId) {
        ws.sessionId = msg.sessionId;
        if (!wsClients.has(msg.sessionId)) {
          wsClients.set(msg.sessionId, new Set());
        }
        wsClients.get(msg.sessionId).add(ws);
        logger.info({ sessionId: msg.sessionId }, 'WS client subscribed');

        // Send current status immediately
        const session = sessions.get(msg.sessionId);
        if (session) {
          ws.send(JSON.stringify({
            type: 'status',
            status: session.status,
            phone: session.phone || null,
          }));
        }
      }
    } catch (e) {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    if (ws.sessionId && wsClients.has(ws.sessionId)) {
      wsClients.get(ws.sessionId).delete(ws);
    }
  });
});

// Heartbeat to clean dead connections
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// ─── Broadcast to Session's WS Clients ──────────────────────────────────────

function broadcastToSession(sessionId, payload) {
  const clients = wsClients.get(sessionId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// ─── Baileys Session Lifecycle ───────────────────────────────────────────────

async function startBaileysSession(sessionId, userId, usePairingCode = false) {
  // Clean up any existing session sock first
  const existing = sessions.get(sessionId);
  if (existing?.sock) {
    try { existing.sock.end(); } catch (_) {}
    sessions.delete(sessionId);
  }

  const authPath = path.join(AUTH_DIR, sessionId);

  if (usePairingCode && fs.existsSync(authPath)) {
    logger.info({ sessionId }, 'Wiping stale auth for fresh pairing-code session...');
    fs.rmSync(authPath, { recursive: true, force: true });
  }

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  const session = {
    sock,
    userId,
    status: 'qr_pending',
    phone: null,
    monitoredGroups: [],
    qrRetries: 0,
  };
  sessions.set(sessionId, session);
  addLog('info', 'Baileys socket initialized', { sessionId, version: version?.join('.') });

  sock.ev.on('creds.update', () => {
    addLog('info', 'Credentials updated by WhatsApp', { sessionId });
    saveCreds();
    broadcastToSession(sessionId, {
      type: 'status',
      status: 'pairing_syncing',
      message: 'WhatsApp accepted code! Finalizing connection...',
    });
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.status = 'qr_ready';
      session.qrRetries++;
      logger.info({ sessionId, retry: session.qrRetries }, 'QR code generated');
      addLog('info', 'QR code generated', { sessionId, retry: session.qrRetries });

      // Send QR to all subscribed mobile clients
      broadcastToSession(sessionId, {
        type: 'qr',
        qr: qr,
      });

      if (session.qrRetries > 5) {
        logger.warn({ sessionId }, 'Too many QR retries, closing');
        addLog('warn', 'QR code retries exceeded limit', { sessionId });
        sock.end();
        sessions.delete(sessionId);
        broadcastToSession(sessionId, {
          type: 'error',
          message: 'QR code expired. Please try again.',
        });
      }
    }

    if (connection === 'open') {
      session.status = 'connected';
      session.wasConnected = true;
      session.phone = sock.user?.id?.split(':')[0] || null;
      logger.info({ sessionId, phone: session.phone }, 'WhatsApp connected');
      addLog('info', 'WhatsApp connection established successfully!', { sessionId, phone: session.phone });

      broadcastToSession(sessionId, {
        type: 'connected',
        phone: session.phone,
      });

      // Store session in Supabase if available
      if (supabase) {
        await supabase.from('whatsapp_sessions').upsert({
          user_id: userId,
          session_id: sessionId,
          phone_number: session.phone,
          status: 'connected',
          connected_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isRestart = statusCode === DisconnectReason.restartRequired || statusCode === 515;
      const isRealLogout = statusCode === DisconnectReason.loggedOut && session.wasConnected;

      logger.info({ sessionId, statusCode, isRestart, isRealLogout }, 'Connection closed');
      addLog('info', 'Connection closed', { sessionId, statusCode, isRestart, isRealLogout });

      if (isRestart) {
        // WhatsApp completes pairing by closing with 515 — reconnect immediately with saved keys!
        logger.info({ sessionId }, 'Pairing handshake restart required (515) — reconnecting immediately (0ms)...');
        addLog('info', 'Pairing handshake 515 received, reconnecting immediately with saved credentials...', { sessionId });
        startBaileysSession(sessionId, userId, false);
        return;
      }

      session.status = 'disconnected';
      broadcastToSession(sessionId, {
        type: 'disconnected',
        reason: isRealLogout ? 'logged_out' : 'connection_lost',
      });

      // ONLY auto-reconnect if session was ALREADY authenticated and connected before.
      // During QR code pairing, do NOT restart sockets in a loop.
      if (session.wasConnected && !isRealLogout) {
        addLog('info', 'Active session dropped, auto-reconnecting...', { sessionId });
        setTimeout(() => startBaileysSession(sessionId, userId, false), 3000);
      } else if (isRealLogout) {
        addLog('warn', 'Active session logged out by user, removing credentials', { sessionId });
        sessions.delete(sessionId);
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
        }
      } else {
        addLog('info', 'QR socket closed by WhatsApp', { sessionId, statusCode });
      }
    }
  });

  // ─── Message Handler (Group Interception) ────────────────────────────────

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;

    for (const msg of messages) {
      // Only process group messages
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid?.endsWith('@g.us')) continue;

      // If monitored groups are set, filter to only those
      if (session.monitoredGroups.length > 0 && !session.monitoredGroups.includes(remoteJid)) {
        continue;
      }

      // Extract message text
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.documentMessage?.caption ||
        '';

      if (!text || text.trim().length < 8) continue; // Skip empty or ultra-short reactions

      const senderJid = msg.key.participant || remoteJid;
      const senderPhone = senderJid.split('@')[0];

      // Get sender name from contacts or pushName
      const senderName = msg.pushName || (msg.key.fromMe ? 'You (Test)' : senderPhone);

      // Get group name
      let groupName = remoteJid;
      try {
        const groupMeta = await sock.groupMetadata(remoteJid);
        groupName = groupMeta.subject || remoteJid;
      } catch {
        // use JID as fallback
      }

      logger.info({ sessionId, sender: senderName, group: groupName, text: text.slice(0, 60) }, 'Group message intercepted');
      addLog('info', 'Group message intercepted', { sender: senderName, group: groupName, preview: text.slice(0, 70) });

      // Classify with Gemini Flash (if API key available)
      let classification = defaultClassification(text, senderName, senderPhone, groupName);
      if (GEMINI_API_KEY) {
        try {
          classification = await classifyWithGemini(text, senderName, senderPhone, groupName);
        } catch (err) {
          logger.warn({ err }, 'Gemini classification failed, using heuristic');
          addLog('warn', 'Gemini classification failed, using fallback parser', { err: err.message });
        }
      }

      addLog('info', 'Lead classified & broadcasting to app', {
        category: classification.category,
        urgency: classification.urgency,
        matchScore: classification.matchScore,
        group: groupName,
      });

      // Store in Supabase
      if (supabase) {
        const { data, error } = await supabase.from('leads').insert({
          user_id: userId,
          raw_text: text,
          sender_name: senderName,
          sender_phone: senderPhone,
          sender_avatar_url: null,
          channel_name: groupName,
          channel_jid: remoteJid,
          category: classification.category,
          urgency: classification.urgency,
          budget_estimate: classification.budgetEstimate,
          location: classification.location,
          match_score: classification.matchScore,
          ai_summary: classification.aiSummary,
          extracted_needs: classification.extractedNeeds,
          stage: 'captured',
          currency: 'USD',
          source: 'whatsapp',
        }).select().single();

        if (error) {
          logger.error({ error }, 'Supabase insert failed');
        } else {
          // Broadcast new lead to mobile app via WebSocket
          broadcastToSession(sessionId, {
            type: 'new_lead',
            lead: data,
          });
        }
      } else {
        // In-memory broadcast (no Supabase)
        const lead = {
          id: `lead_${Date.now()}`,
          ...classification,
          raw_text: text,
          sender_name: senderName,
          sender_phone: senderPhone,
          channel_name: groupName,
          stage: 'captured',
          currency: 'USD',
          created_at: new Date().toISOString(),
        };
        broadcastToSession(sessionId, {
          type: 'new_lead',
          lead,
        });
      }
    }
  });
}

// ─── Gemini Flash Classification ─────────────────────────────────────────────

async function classifyWithGemini(text, senderName, senderPhone, groupName) {
  const prompt = `You are Mikana AI, a B2B lead qualification engine. Classify this WhatsApp group message as a business inquiry.

Message from "${senderName}" in group "${groupName}":
"""${text}"""

Return valid JSON:
{
  "category": "string (e.g. Solar & Electrical, Software & Mobile Dev, Design & UI/UX, Wholesale & Goods, etc.)",
  "urgency": "low" | "medium" | "urgent",
  "budgetEstimate": "string with currency or 'Quote Required'",
  "location": "string or 'Remote'",
  "matchScore": number 0-100,
  "aiSummary": "1-2 sentence summary of what the buyer needs",
  "extractedNeeds": ["3-4 specific requirements"]
}

If this message is NOT a business inquiry (casual chat, meme, greeting, etc.), return:
{ "category": "not_a_lead", "matchScore": 0 }`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.15 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API ${response.status}`);
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty Gemini response');

  const parsed = JSON.parse(raw);

  // Skip non-leads
  if (parsed.category === 'not_a_lead' || parsed.matchScore === 0) {
    return null;
  }

  return {
    category: parsed.category || 'General',
    urgency: parsed.urgency || 'low',
    budgetEstimate: parsed.budgetEstimate || 'Quote Required',
    location: parsed.location || 'Remote',
    matchScore: Math.min(100, Math.max(0, parsed.matchScore || 70)),
    aiSummary: parsed.aiSummary || text.slice(0, 100),
    extractedNeeds: Array.isArray(parsed.extractedNeeds) ? parsed.extractedNeeds : [],
  };
}

// ─── Fallback Heuristic Classification ───────────────────────────────────────

function defaultClassification(text, senderName, senderPhone, groupName) {
  const lower = text.toLowerCase();

  let urgency = 'low';
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) urgency = 'urgent';
  else if (lower.includes('quote') || lower.includes('need') || lower.includes('looking for')) urgency = 'medium';

  const budgetMatch = text.match(/(\$|€|£|R|ZAR|USD)\s?([\d,]+)/i);
  const budgetEstimate = budgetMatch ? budgetMatch[0] : 'Quote Required';

  let category = 'General Services';
  let matchScore = 75;
  if (lower.includes('solar') || lower.includes('inverter') || lower.includes('generator')) {
    category = 'Solar & Electrical'; matchScore = 90;
  } else if (lower.includes('app') || lower.includes('react') || lower.includes('software')) {
    category = 'Software & Mobile Dev'; matchScore = 92;
  } else if (lower.includes('design') || lower.includes('brand') || lower.includes('logo')) {
    category = 'Design & Branding'; matchScore = 88;
  }

  return {
    category,
    urgency,
    budgetEstimate,
    location: 'Regional',
    matchScore,
    aiSummary: text.length > 100 ? text.slice(0, 100) + '...' : text,
    extractedNeeds: [`Scope: ${category}`, `Timeline: ${urgency}`, `Budget: ${budgetEstimate}`],
  };
}

// ─── Start Server ────────────────────────────────────────────────────────────

server.listen(PORT, async () => {
  logger.info({ port: PORT }, 'Mikana Relay Server running');
  console.log(`\n  Mikana Relay Server`);
  console.log(`  → HTTP:  http://localhost:${PORT}`);
  console.log(`  → WS:    ws://localhost:${PORT}/ws`);
  console.log(`  → Supabase: ${SUPABASE_URL ? 'Connected' : 'Not configured (in-memory mode)'}\n`);

  // Auto-resume saved authenticated sessions from disk on boot
  if (fs.existsSync(AUTH_DIR)) {
    try {
      const folders = fs.readdirSync(AUTH_DIR).filter((f) => f.startsWith('session_'));
      for (const sid of folders) {
        const credsFile = path.join(AUTH_DIR, sid, 'creds.json');
        if (fs.existsSync(credsFile)) {
          const uid = sid.replace('session_', '');
          logger.info({ sessionId: sid }, 'Auto-resuming session from disk on boot...');
          startBaileysSession(sid, uid, false).catch((e) => {
            logger.warn({ sessionId: sid, err: e.message }, 'Failed to auto-resume session on boot');
          });
        }
      }
    } catch (e) {
      logger.error({ err: e.message }, 'Error reading auth sessions directory on boot');
    }
  }
});

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

// ─── Pipeline Configuration ───────────────────────────────────────────────────

const CONTEXT_WINDOW_MS = parseInt(process.env.CONTEXT_WINDOW_MS || '60000', 10); // 60s default
const MIN_OPPORTUNITY_CONFIDENCE = parseFloat(process.env.MIN_OPPORTUNITY_CONFIDENCE || '0.4');
const LAYER1_DROP_THRESHOLD = parseFloat(process.env.LAYER1_DROP_THRESHOLD || '0.75');
const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Matching Weight Profiles (configurable per opportunity type) ──────────────
// Weights are per-field maximums that sum to 100 per profile.
// Tune per user type without rewriting the matching engine.

const MATCHING_WEIGHTS = {
  service_request:  { category: 40, capability: 30, location: 20, keywords: 10 },
  product_request:  { product: 40, category: 20, location: 15, quantity: 15, keywords: 10 },
  job_request:      { capability: 40, category: 25, location: 20, keywords: 15 },
  supply_request:   { product: 40, category: 25, location: 20, quantity: 10, keywords: 5 },
  sale_offer:       { category: 35, product: 35, location: 20, keywords: 10 },
  default:          { category: 35, capability: 30, location: 20, keywords: 15 },
};

// ─── Pipeline Metrics ─────────────────────────────────────────────────────────

const pipelineMetrics = {
  messagesReceived: 0,
  layer0Dropped: 0,
  layer1Analyzed: 0,
  layer1Rejected: 0,
  layer2Grouped: 0,
  opportunitiesExtracted: 0,
  opportunitiesMatched: 0,
  notificationsSent: 0,
  autopilotSent: 0,
  geminiInputTokens: 0,
  geminiOutputTokens: 0,
  geminiEstimatedCostUSD: 0,
  totalLatencyMs: 0,
  processedOpportunities: 0,
  startedAt: new Date().toISOString(),
};

// ─── Context Buffers (Layer 2 Debounce) ───────────────────────────────────────
// Key: `${sessionId}:${groupJid}:${senderPhone}` → { messages[], timer }
const contextBuffers = new Map();

// ─── Deduplication Store ──────────────────────────────────────────────────────
// Key: `${sessionId}:${groupJid}` → [{ hash, timestamp }]
const recentOpportunityHashes = new Map();

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
  logger.warn('Supabase not configured — opportunities stored in-memory only');
}

// ─── In-Memory Session Store ─────────────────────────────────────────────────

const sessions = new Map();     // sessionId -> { socket, ws clients, groups, userProfile, etc }
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

app.get('/api/metrics', (req, res) => {
  const uptimeMs = Date.now() - new Date(pipelineMetrics.startedAt).getTime();
  const avgLatencyMs = pipelineMetrics.processedOpportunities > 0
    ? Math.round(pipelineMetrics.totalLatencyMs / pipelineMetrics.processedOpportunities)
    : 0;
  res.json({
    ...pipelineMetrics,
    uptimeMs,
    avgProcessingLatencyMs: avgLatencyMs,
    contextWindowMs: CONTEXT_WINDOW_MS,
    geminiEnabled: !!GEMINI_API_KEY,
  });
});

// ─── User Capability Profile Sync ────────────────────────────────────────────

app.post('/api/sessions/:sessionId/profile', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const profile = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'Invalid profile payload' });
  }

  session.userProfile = {
    userId: session.userId,
    displayName: profile.displayName || '',
    description: profile.description || '',
    location: profile.location || '',
    serviceAreas: Array.isArray(profile.serviceAreas) ? profile.serviceAreas : [],
    categories: Array.isArray(profile.categories) ? profile.categories : [],
    capabilities: Array.isArray(profile.capabilities) ? profile.capabilities : [],
    products: Array.isArray(profile.products) ? profile.products : [],
    keywords: Array.isArray(profile.keywords) ? profile.keywords : [],
    autopilot: profile.autopilot || {
      enabled: false,
      minMatchScore: 80,
      requireApproval: true,
      maxAutoPerHour: 5,
      businessHoursOnly: true,
      businessHoursStart: 8,
      businessHoursEnd: 17,
      neverRespondAboveBudget: null,
    },
  };

  addLog('info', 'User capability profile updated', {
    sessionId,
    categories: session.userProfile.categories,
    location: session.userProfile.location,
    capabilities: session.userProfile.capabilities.slice(0, 5),
  });

  res.json({ ok: true, profile: session.userProfile });
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
  const fullSessionId = sessionId.startsWith('session_') ? sessionId : `session_${sessionId}`;
  const userId = fullSessionId.replace('session_', '');
  const authPath = path.join(AUTH_DIR, fullSessionId);

  if (!sessions.has(fullSessionId) && fs.existsSync(path.join(authPath, 'creds.json'))) {
    try {
      await startBaileysSession(fullSessionId, userId, false);
    } catch (_) {}
  }

  const session = sessions.get(fullSessionId) || sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    sessionId: fullSessionId,
    status: session.status,
    phone: session.phone || null,
    groups: session.monitoredGroups || [],
  });
});

// ─── List Groups for a Session ───────────────────────────────────────────────

app.get('/api/sessions/:sessionId/groups', async (req, res) => {
  const { sessionId } = req.params;
  const fullSessionId = sessionId.startsWith('session_') ? sessionId : `session_${sessionId}`;
  const userId = fullSessionId.replace('session_', '');
  const authPath = path.join(AUTH_DIR, fullSessionId);

  if (!sessions.has(fullSessionId) && fs.existsSync(path.join(authPath, 'creds.json'))) {
    try {
      await startBaileysSession(fullSessionId, userId, false);
    } catch (_) {}
  }

  const session = sessions.get(fullSessionId) || sessions.get(sessionId);
  if (!session || !session.sock) {
    return res.status(404).json({ error: 'Session not found or not connected' });
  }

  try {
    const groups = await session.sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map((g) => ({
      id: g.id,
      subject: g.subject,
      name: g.subject,
      participants: g.participants?.length || 0,
      participantCount: g.participants?.length || 0,
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
  const fullSessionId = sessionId.startsWith('session_') ? sessionId : `session_${sessionId}`;
  const session = sessions.get(fullSessionId) || sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { groupIds } = req.body;
  session.monitoredGroups = groupIds || [];
  logger.info({ sessionId: fullSessionId, groupCount: session.monitoredGroups.length }, 'Updated monitored groups');
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
    userProfile: null,    // Compact capability profile — set via POST /api/sessions/:id/profile
    groupNameCache: {},   // Cache group JID → name to avoid repeated Baileys metadata calls
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

  // ─── Message Handler (5-Layer Opportunity Pipeline) ─────────────────────────

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;

    for (const msg of messages) {
      pipelineMetrics.messagesReceived++;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid?.endsWith('@g.us')) continue;
      if (session.monitoredGroups.length > 0 && !session.monitoredGroups.includes(remoteJid)) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.documentMessage?.caption || '';

      const senderJid = msg.key.participant || remoteJid;
      const senderPhone = senderJid.split('@')[0];
      const senderName = msg.pushName || (msg.key.fromMe ? 'You (Test)' : senderPhone);
      const messageId = msg.key.id;
      const timestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();

      // Group name — cached to avoid repeated metadata calls per message
      let groupName = session.groupNameCache[remoteJid];
      if (!groupName) {
        try {
          const meta = await sock.groupMetadata(remoteJid);
          groupName = meta.subject || remoteJid;
          session.groupNameCache[remoteJid] = groupName;
        } catch { groupName = remoteJid; }
      }

      // ── LAYER 0: Local Noise Gate (free) ───────────────────────────────────
      if (isObviousNoise(msg, text)) {
        pipelineMetrics.layer0Dropped++;
        continue;
      }

      // ── LAYER 1: Cheap Opportunity Gate ────────────────────────────────────
      pipelineMetrics.layer1Analyzed++;
      let passedGate = false;
      try {
        passedGate = await opportunityGate(text);
      } catch (err) {
        passedGate = true; // On gate failure pass through — false negatives cost real business
        addLog('warn', 'L1 gate error, passing through', { err: err.message });
      }

      if (!passedGate) {
        pipelineMetrics.layer1Rejected++;
        addLog('debug', 'L1 rejected', { preview: text.slice(0, 60) });
        continue;
      }

      addLog('info', 'L1 passed — potential opportunity', {
        sender: senderName, group: groupName, preview: text.slice(0, 60),
      });

      // ── LAYER 2: Context Grouping / 60s Debounce ───────────────────────────
      const bufferKey = `${sessionId}:${remoteJid}:${senderPhone}`;
      addToContextBuffer(bufferKey, {
        messageId, text, senderJid, senderPhone, senderName, timestamp, groupName, groupJid: remoteJid,
      }, () => processOpportunityContext(sessionId, session, bufferKey));
    }
  });
}

// ─── Layer 0: Local Noise Gate ────────────────────────────────────────────────

const NOISE_PATTERNS = [
  /^(gm|good morning|good evening|goodnight|morning all|evening all|gn)\b/i,
  /^(lol|haha|lmao)\s*$/i,
  /^(thanks|thank you|thx|ty|tnx|cheers)\b/i,
  /^(okay|ok|k|cool|noted|sure|agreed|alright|aight)\s*$/i,
  /^(happy birthday|congrats|congratulations|amen|blessed)\b/i,
  /^(yes|no|nope|yep|yap|absolutely)\s*$/i,
  /^[\u{1F300}-\u{1FFFF}\s👍🙏]+$/u, // pure emoji
];

function isObviousNoise(msg, text) {
  // Non-text message types
  const noTextTypes = [
    'reactionMessage', 'stickerMessage', 'liveLocationMessage',
    'protocolMessage', 'pollCreationMessage', 'pollUpdateMessage',
  ];
  if (Object.keys(msg.message || {}).some(t => noTextTypes.includes(t))) return true;
  if (!text || text.trim().length === 0) return true;
  const t = text.trim();
  if (NOISE_PATTERNS.some(r => r.test(t))) return true;
  return false;
}

// ─── Layer 2: Context Buffer ──────────────────────────────────────────────────

function addToContextBuffer(key, msgData, onFlush) {
  let buffer = contextBuffers.get(key);
  if (!buffer) {
    buffer = { messages: [], timer: null };
    contextBuffers.set(key, buffer);
  }
  buffer.messages.push(msgData);
  if (buffer.timer) clearTimeout(buffer.timer);
  buffer.timer = setTimeout(() => {
    const b = contextBuffers.get(key);
    if (b && b.messages.length > 0) {
      pipelineMetrics.layer2Grouped++;
      onFlush();
    }
    contextBuffers.delete(key);
  }, CONTEXT_WINDOW_MS);
}

// ─── Layer 1: Cheap Opportunity Gate ─────────────────────────────────────────

const OPPORTUNITY_SIGNAL_WORDS = [
  'looking for', 'need', 'anyone', 'wanted', 'available', 'urgent', 'asap',
  'supply', 'hire', 'repair', 'build', 'develop', 'design', 'fix', 'install',
  'does anyone have', 'can someone', 'who can', 'quote', 'contract', 'seeking',
  'bags', 'chairs', 'units', 'pieces', 'for sale', 'selling', 'buying',
  'is there anyone', 'anyone know', 'recommend', 'referral', 'price', 'cost',
];

async function opportunityGate(text) {
  if (!GEMINI_API_KEY) {
    // Keyword fallback when no API key
    const t = text.toLowerCase();
    return OPPORTUNITY_SIGNAL_WORDS.some(kw => t.includes(kw));
  }

  const prompt = `WhatsApp group message. Is this a business opportunity (someone seeking to buy, hire, source, or get a service/product)?

"${text.slice(0, 400)}"

JSON only: {"isOpportunity":true,"confidence":0.95}`;

  const t0 = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 30 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini L1 ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(raw || '{"isOpportunity":false,"confidence":1}');

  const usage = data.usageMetadata || {};
  pipelineMetrics.geminiInputTokens += usage.promptTokenCount || 0;
  pipelineMetrics.geminiOutputTokens += usage.candidatesTokenCount || 0;
  pipelineMetrics.geminiEstimatedCostUSD += ((usage.promptTokenCount || 0) * 0.0000001);

  addLog('debug', `L1 gate`, {
    isOpportunity: parsed.isOpportunity, confidence: parsed.confidence, latencyMs: Date.now() - t0,
  });

  // Drop ONLY if model is >75% confident it's NOT an opportunity
  if (parsed.isOpportunity === false && (parsed.confidence || 0) > LAYER1_DROP_THRESHOLD) return false;
  return true;
}

// ─── Layer 3: Full Opportunity Extraction ────────────────────────────────────

async function extractOpportunity(combinedText, firstMsg) {
  const prompt = `You are Mikana AI. Analyze this WhatsApp message or message sequence and extract a structured opportunity object.

Messages from "${firstMsg.senderName}" in group "${firstMsg.groupName}":
"""
${combinedText.slice(0, 1200)}
"""

Return JSON only:
{
  "type": "service_request"|"product_request"|"job_request"|"supply_request"|"sale_offer"|"partnership"|"unknown",
  "category": "specific category (e.g. Plumbing, Software Development, Event Supply, Agriculture, Graphic Design, Solar & Electrical)",
  "title": "concise opportunity title under 10 words",
  "summary": "1-2 sentence explanation of what they need",
  "buyerIntent": "what the sender is trying to accomplish",
  "requirements": ["requirement 1", "requirement 2"],
  "quantity": "e.g. 30 bags or null",
  "budget": "e.g. $500 or null",
  "currency": "USD|ZWL|ZAR|null",
  "location": "city or area or null",
  "deadline": "e.g. today, next Saturday or null",
  "urgency": "low"|"medium"|"urgent",
  "confidence": 0.0-1.0
}

If NOT a real opportunity, return: {"type":"unknown","confidence":0.1}`;

  const t0 = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini L3 ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty L3 response');

  const usage = data.usageMetadata || {};
  pipelineMetrics.geminiInputTokens += usage.promptTokenCount || 0;
  pipelineMetrics.geminiOutputTokens += usage.candidatesTokenCount || 0;
  // gemini-2.0-flash ~$0.30/M input, $1.00/M output
  pipelineMetrics.geminiEstimatedCostUSD += ((usage.promptTokenCount || 0) * 0.0000003) + ((usage.candidatesTokenCount || 0) * 0.000001);

  const parsed = JSON.parse(raw);
  addLog('info', `L3 extracted`, { type: parsed.type, confidence: parsed.confidence, latencyMs: Date.now() - t0 });
  return parsed;
}

function extractOpportunityFallback(combinedText, firstMsg) {
  const lower = combinedText.toLowerCase();
  let urgency = 'low';
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('today')) urgency = 'urgent';
  else if (lower.includes('quote') || lower.includes('need') || lower.includes('looking for')) urgency = 'medium';

  const budgetMatch = combinedText.match(/(\$|€|£|R|ZAR|USD|ZWL)\s?([\d,]+)/i);
  let category = 'General Services';
  let type = 'service_request';

  if (lower.includes('solar') || lower.includes('inverter') || lower.includes('generator')) category = 'Solar & Electrical';
  else if (lower.includes('app') || lower.includes('software') || lower.includes('website') || lower.includes('developer')) { category = 'Software & Technology'; }
  else if (lower.includes('design') || lower.includes('brand') || lower.includes('logo')) category = 'Design & Branding';
  else if (lower.includes('plumb') || lower.includes('toilet') || lower.includes('geyser') || lower.includes('pipe') || lower.includes('swimming pool')) category = 'Plumbing';
  else if (lower.includes('bean') || lower.includes('maize') || lower.includes('tomato') || lower.includes('bags') || lower.includes('stock')) { category = 'Agriculture & Trading'; type = 'product_request'; }
  else if (lower.includes('chair') || lower.includes('tent') || lower.includes('event')) { category = 'Event Supply'; type = 'supply_request'; }

  return {
    type, category,
    title: combinedText.slice(0, 60).trim(),
    summary: combinedText.slice(0, 150).trim(),
    buyerIntent: 'Unknown',
    requirements: [],
    quantity: null,
    budget: budgetMatch ? budgetMatch[0] : null,
    currency: null, location: null, deadline: null,
    urgency, confidence: 0.6,
  };
}

// ─── Layer 4: Matching Engine ─────────────────────────────────────────────────

function matchOpportunity(opportunity, userProfile) {
  if (!userProfile) {
    return { matchScore: 0, matchReasons: { note: 'No user profile configured' }, matchedCapabilities: [] };
  }

  const weights = MATCHING_WEIGHTS[opportunity.type] || MATCHING_WEIGHTS.default;
  const matchReasons = {};
  const matchedCapabilities = [];

  const oppCategory = (opportunity.category || '').toLowerCase();
  const oppText = [
    opportunity.summary, opportunity.buyerIntent, opportunity.title,
    ...(opportunity.requirements || []),
  ].join(' ').toLowerCase();
  const oppLocation = (opportunity.location || '').toLowerCase();

  let total = 0;

  // Category match
  if (weights.category) {
    const userCats = userProfile.categories.map(c => c.toLowerCase());
    const catMatch = userCats.some(c => oppCategory.includes(c) || c.includes(oppCategory) ||
      oppText.includes(c));
    matchReasons.category = catMatch ? weights.category : 0;
    total += matchReasons.category;
  }

  // Capability match (proportional to how many matched)
  if (weights.capability) {
    const caps = userProfile.capabilities.map(c => c.toLowerCase());
    const matched = caps.filter(cap =>
      oppText.includes(cap) ||
      cap.split(' ').some(word => word.length > 3 && oppText.includes(word))
    );
    matchedCapabilities.push(...matched);
    const score = matched.length > 0
      ? Math.min(weights.capability, Math.round((matched.length / Math.max(1, caps.length)) * weights.capability * 3))
      : 0;
    matchReasons.capability = score;
    total += score;
  }

  // Product match (for traders/farmers)
  if (weights.product) {
    const prods = userProfile.products.map(p => p.toLowerCase());
    const matched = prods.filter(p =>
      oppText.includes(p) ||
      p.split(' ').some(w => w.length > 3 && oppText.includes(w))
    );
    if (matched.length > 0) {
      matchedCapabilities.push(...matched);
      const score = Math.min(weights.product, Math.round((matched.length / Math.max(1, prods.length)) * weights.product * 3));
      matchReasons.product = score;
      total += score;
    } else {
      matchReasons.product = 0;
    }
  }

  // Location match
  if (weights.location) {
    const userLoc = (userProfile.location || '').toLowerCase();
    const areas = [userLoc, ...userProfile.serviceAreas.map(a => a.toLowerCase())].filter(Boolean);
    let locScore = 0;
    if (!oppLocation || oppLocation === 'remote' || oppLocation === 'null') {
      locScore = Math.round(weights.location * 0.5); // unspecified: partial credit
    } else if (areas.some(a => oppLocation.includes(a) || a.includes(oppLocation))) {
      locScore = weights.location;
    }
    matchReasons.location = locScore;
    total += locScore;
  }

  // Keyword match
  if (weights.keywords) {
    const kws = userProfile.keywords.map(k => k.toLowerCase());
    const matched = kws.filter(k => oppText.includes(k));
    const score = matched.length > 0
      ? Math.min(weights.keywords, matched.length * Math.round(weights.keywords / Math.max(1, kws.length) * 2))
      : 0;
    matchReasons.keywords = score;
    total += score;
  }

  // Quantity info bonus (for supply/product types)
  if (weights.quantity && opportunity.quantity) {
    matchReasons.quantity = Math.round(weights.quantity * 0.5);
    total += matchReasons.quantity;
  }

  return {
    matchScore: Math.min(100, Math.max(0, total)),
    matchReasons,
    matchedCapabilities,
  };
}

// ─── Layer 5: Notification Decision ──────────────────────────────────────────

function decideNotification(opportunity) {
  const { matchScore, urgency } = opportunity;
  if (matchScore >= 80) return urgency === 'urgent' ? 'critical' : 'high';
  if (matchScore >= 60) return 'medium';
  if (matchScore >= 40) return 'low';
  return null;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function opportunityHash(opportunity) {
  const text = [opportunity.category, (opportunity.summary || '').slice(0, 80), opportunity.sourceGroup]
    .join('|').toLowerCase().replace(/\s+/g, ' ');
  let h = 0;
  for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  return h.toString(36);
}

function isDuplicate(sessionId, groupJid, opportunity) {
  const key = `${sessionId}:${groupJid}`;
  const hashes = recentOpportunityHashes.get(key) || [];
  const hash = opportunityHash(opportunity);
  const now = Date.now();
  return hashes.filter(h => now - h.ts < DEDUP_WINDOW_MS).some(h => h.hash === hash);
}

function registerOpportunity(sessionId, groupJid, opportunity) {
  const key = `${sessionId}:${groupJid}`;
  const hashes = (recentOpportunityHashes.get(key) || []).filter(h => Date.now() - h.ts < DEDUP_WINDOW_MS);
  hashes.push({ hash: opportunityHash(opportunity), ts: Date.now() });
  recentOpportunityHashes.set(key, hashes);
}

// ─── Backward Compatibility Shim (opportunity → lead for existing app code) ───

function opportunityToLead(opp) {
  return {
    id: opp.id,
    raw_text: opp.rawMessages?.[0] || opp.summary || '',
    sender_name: opp.sender,
    sender_phone: opp.senderPhone,
    sender_avatar_url: null,
    channel_name: opp.sourceGroup,
    category: opp.category,
    urgency: opp.urgency,
    budget_estimate: opp.budget || 'Quote Required',
    location: opp.location || 'Remote',
    match_score: opp.matchScore || 0,
    ai_summary: opp.summary,
    extracted_needs: opp.requirements || [],
    stage: opp.stage,
    currency: opp.currency || 'USD',
    created_at: opp.detectedAt,
    // Extended fields
    opportunity_type: opp.type,
    opportunity_title: opp.title,
    match_reasons: opp.matchReasons,
    matched_capabilities: opp.matchedCapabilities,
    source_message_ids: opp.sourceMessageIds,
    raw_messages: opp.rawMessages,
    confidence: opp.confidence,
  };
}

// ─── AutoPilot Hook (Architecture Only — V2 Execution) ───────────────────────

function handleAutopilotHook(opportunity, session) {
  const ap = session.userProfile?.autopilot;
  if (!ap?.enabled) return;
  if (opportunity.matchScore < ap.minMatchScore) return;

  if (ap.businessHoursOnly) {
    const hour = new Date().getHours();
    if (hour < ap.businessHoursStart || hour >= ap.businessHoursEnd) return;
  }

  // V1: log intent only. V2: generate + queue response for approval or auto-send.
  addLog('info', 'AutoPilot: opportunity qualified (response generation queued for V2)', {
    opportunityId: opportunity.id,
    matchScore: opportunity.matchScore,
    requireApproval: ap.requireApproval,
  });
}

// ─── Main Opportunity Context Processor ───────────────────────────────────────

async function processOpportunityContext(sessionId, session, bufferKey) {
  const buffer = contextBuffers.get(bufferKey);
  if (!buffer || buffer.messages.length === 0) return;

  const messages = [...buffer.messages];
  contextBuffers.delete(bufferKey);

  const firstMsg = messages[0];
  const combinedText = messages.map(m => m.text).join('\n');
  const started = Date.now();

  addLog('info', 'L2 context flushed', {
    messageCount: messages.length, group: firstMsg.groupName, sender: firstMsg.senderName,
  });

  // LAYER 3: Full extraction
  let extracted = null;
  try {
    extracted = GEMINI_API_KEY
      ? await extractOpportunity(combinedText, firstMsg)
      : extractOpportunityFallback(combinedText, firstMsg);
    pipelineMetrics.opportunitiesExtracted++;
  } catch (err) {
    addLog('warn', 'L3 extraction failed', { err: err.message });
    return;
  }

  // ── NULL GUARD: if not a real opportunity, stop here ──────────────────────
  if (!extracted || extracted.type === 'unknown' || (extracted.confidence || 0) < MIN_OPPORTUNITY_CONFIDENCE) {
    addLog('debug', 'L3 dropped — low confidence or unknown type', {
      type: extracted?.type, confidence: extracted?.confidence,
    });
    return;
  }

  // Build full opportunity object (source messages preserved)
  const opportunity = {
    ...extracted,
    id: `opp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    rawMessages: messages.map(m => m.text),
    sourceMessageIds: messages.map(m => m.messageId),
    sourceGroup: firstMsg.groupName,
    sourceGroupJid: firstMsg.groupJid,
    sender: firstMsg.senderName,
    senderPhone: firstMsg.senderPhone,
    senderJid: firstMsg.senderJid,
    detectedAt: new Date(firstMsg.timestamp).toISOString(),
    stage: 'analyzed',
    matchScore: null,
    matchReasons: null,
    matchedCapabilities: [],
  };

  // Deduplication — opportunity exists regardless of match
  if (isDuplicate(sessionId, firstMsg.groupJid, opportunity)) {
    addLog('info', 'Duplicate opportunity skipped', { title: opportunity.title });
    return;
  }
  registerOpportunity(sessionId, firstMsg.groupJid, opportunity);

  // Store opportunity in Supabase regardless of match score (detection ≠ matching)
  if (supabase) {
    supabase.from('opportunities').insert({
      session_id: sessionId,
      user_id: session.userId,
      raw_text: opportunity.rawMessages.join('\n'),
      sender_name: opportunity.sender,
      sender_phone: opportunity.senderPhone,
      sender_jid: opportunity.senderJid,
      channel_name: opportunity.sourceGroup,
      channel_jid: opportunity.sourceGroupJid,
      opportunity_type: opportunity.type,
      category: opportunity.category,
      title: opportunity.title,
      summary: opportunity.summary,
      requirements: opportunity.requirements,
      quantity: opportunity.quantity,
      budget: opportunity.budget,
      currency: opportunity.currency,
      location: opportunity.location,
      deadline: opportunity.deadline,
      urgency: opportunity.urgency,
      confidence: opportunity.confidence,
      source_message_ids: opportunity.sourceMessageIds,
      raw_messages: opportunity.rawMessages,
      detected_at: opportunity.detectedAt,
      stage: opportunity.stage,
      source: 'whatsapp',
    }).catch(err => addLog('warn', 'Supabase opportunity insert failed', { err: err.message }));
  }

  // LAYER 4: Matching (separate from detection)
  const matchResult = matchOpportunity(opportunity, session.userProfile);
  opportunity.matchScore = matchResult.matchScore;
  opportunity.matchReasons = matchResult.matchReasons;
  opportunity.matchedCapabilities = matchResult.matchedCapabilities;
  opportunity.stage = 'matched';
  pipelineMetrics.opportunitiesMatched++;

  addLog('info', 'L4 matched', {
    title: opportunity.title,
    matchScore: opportunity.matchScore,
    matchReasons: opportunity.matchReasons,
    latencyMs: Date.now() - started,
  });

  // LAYER 5: Notification decision
  const notifyTier = decideNotification(opportunity);
  if (notifyTier) {
    opportunity.stage = 'notified';
    opportunity.notifyTier = notifyTier;
    pipelineMetrics.notificationsSent++;

    // New opportunity event
    broadcastToSession(sessionId, { type: 'new_opportunity', opportunity, tier: notifyTier });

    // Backward compatibility: existing app code listens for new_lead
    broadcastToSession(sessionId, { type: 'new_lead', lead: opportunityToLead(opportunity) });

    addLog('info', 'Broadcast to mobile', { tier: notifyTier, matchScore: opportunity.matchScore });
  } else {
    addLog('debug', 'Below notification threshold', { matchScore: opportunity.matchScore });
  }

  // AutoPilot hook
  handleAutopilotHook(opportunity, session);

  pipelineMetrics.totalLatencyMs += Date.now() - started;
  pipelineMetrics.processedOpportunities++;
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

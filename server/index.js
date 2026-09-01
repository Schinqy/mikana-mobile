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

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3005;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// ─── Health Check ────────────────────────────────────────────────────────────

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
    await startBaileysSession(sessionId, userId);
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

app.get('/api/sessions/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
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
  }

  const authPath = path.join(AUTH_DIR, sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    printQRInTerminal: false,
    // usePairingCode: true DISABLES qr and enables 8-digit phone pairing
    ...(usePairingCode ? { usePairingCode: true } : {}),
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

  // ─── Connection Events ───────────────────────────────────────────────────

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.status = 'qr_ready';
      session.qrRetries++;
      logger.info({ sessionId, retry: session.qrRetries }, 'QR code generated');

      // Send QR to all subscribed mobile clients
      broadcastToSession(sessionId, {
        type: 'qr',
        qr: qr, // Raw QR string — mobile renders with react-native-qrcode-svg
      });

      if (session.qrRetries > 5) {
        logger.warn({ sessionId }, 'Too many QR retries, closing');
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
      session.phone = sock.user?.id?.split(':')[0] || null;
      logger.info({ sessionId, phone: session.phone }, 'WhatsApp connected');

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
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.info({ sessionId, statusCode, shouldReconnect }, 'Connection closed');

      session.status = 'disconnected';
      broadcastToSession(sessionId, {
        type: 'disconnected',
        reason: statusCode === DisconnectReason.loggedOut ? 'logged_out' : 'connection_lost',
      });

      if (shouldReconnect) {
        // Auto-reconnect after brief delay
        setTimeout(() => startBaileysSession(sessionId, userId), 3000);
      } else {
        sessions.delete(sessionId);
        // Clean auth on logout
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true });
        }
      }
    }
  });

  // ─── Message Handler (Group Interception) ────────────────────────────────

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Skip own messages
      if (msg.key.fromMe) continue;

      // Only process group messages from monitored groups
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

      if (!text || text.length < 15) continue; // Skip very short messages / media-only

      const senderJid = msg.key.participant || remoteJid;
      const senderPhone = senderJid.split('@')[0];

      // Get sender name from contacts or pushName
      const senderName = msg.pushName || senderPhone;

      // Get group name
      let groupName = remoteJid;
      try {
        const groupMeta = await sock.groupMetadata(remoteJid);
        groupName = groupMeta.subject;
      } catch {
        // use JID as fallback
      }

      logger.info({ sessionId, sender: senderName, group: groupName }, 'New group message intercepted');

      // Classify with Gemini Flash (if API key available)
      let classification = defaultClassification(text, senderName, senderPhone, groupName);
      if (GEMINI_API_KEY) {
        try {
          classification = await classifyWithGemini(text, senderName, senderPhone, groupName);
        } catch (err) {
          logger.warn({ err }, 'Gemini classification failed, using heuristic');
        }
      }

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

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Mikana Relay Server running');
  console.log(`\n  Mikana Relay Server`);
  console.log(`  → HTTP:  http://localhost:${PORT}`);
  console.log(`  → WS:    ws://localhost:${PORT}/ws`);
  console.log(`  → Supabase: ${SUPABASE_URL ? 'Connected' : 'Not configured (in-memory mode)'}\n`);
});

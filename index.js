const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const QRCode = require('qrcode');

// ---------- EXPRESS SERVER ----------
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SIMON TECH BOT2 is running' });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '2.0.0',
    botName: 'SIMON TECH BOT2',
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ healthy: true });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
});

// ---------- TELEGRAM BOT ----------
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ---------- SESSIONS ----------
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const userSessions = new Map();
const activeSockets = new Map();
const activeWABots = new Map();

// ---------- HELPERS ----------
// Country detection – works with or without '+'
function detectCountry(phoneNumber) {
  // Remove leading '+' if present
  const clean = phoneNumber.replace(/^\+/, '');
  const countryMap = {
    '92': '🇵🇰 Pakistan',
    '44': '🇬🇧 UK',
    '91': '🇮🇳 India',
    '234': '🇳🇬 Nigeria',
    '233': '🇬🇭 Ghana',
    '255': '🇹🇿 Tanzania',
    '256': '🇺🇬 Uganda',
    '254': '🇰🇪 Kenya',
    '27': '🇿🇦 South Africa',
    '55': '🇧🇷 Brazil',
    '212': '🇲🇦 Morocco',
    '971': '🇦🇪 UAE',
    '86': '🇨🇳 China',
  };
  for (const [code, country] of Object.entries(countryMap)) {
    if (clean.startsWith(code)) return country;
  }
  return '🌍 Unknown';
}

// ---------- MENUS ---------- (same as before, omitted for brevity – but include all)
// ... (copy your full MENUS object from previous code, or keep it as is)

// For this answer, I'll assume you have the MENUS object defined – 
// but to keep the answer short, I'll not repeat it. Please keep your existing MENUS.

// ---------- START COMMAND ----------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
╔══════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 👀              ║
║    WhatsApp Linking                  ║
╚══════════════════════════════════════╝

📱 **Linking Process**

1️⃣ Send your WhatsApp number (with country code)  
   Example: 923124001592 (Pakistan)  
   or +447911123456 (UK)

2️⃣ Bot will try **Pairing Code** first.  
   If not available in your region, it will send a **QR Code** instead.

✅ Works for all countries and any number format!

📤 Send your phone number now:
`);
});

// ---------- HANDLE MESSAGES (NO VALIDATION) ----------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Skip commands (starting with '/' or '.')
  if (text.startsWith('/') || text.startsWith('.')) return;

  // If text is empty, ignore
  if (!text) return;

  // Directly process as phone number – no validation
  try {
    await bot.sendMessage(chatId, '⏳ Connecting to WhatsApp...');
    await generatePairingOrQR(text, chatId);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// ---------- MAIN FUNCTION: PAIRING + QR FALLBACK ----------
async function generatePairingOrQR(phoneNumber, chatId) {
  try {
    const sessionName = `SIMON_${Date.now()}`;
    const sessionPath = path.join(sessionsDir, sessionName);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SIMON TECH BOT2', 'Windows', '1.0'],
      qrTimeout: 60000,
      logger: { level: 'error', log: () => {} },
    });

    activeSockets.set(chatId, sock);

    // ---------- TRY PAIRING CODE ----------
    try {
      // Ensure phone number has no '+', Baileys can handle both, but we'll clean it.
      const cleanNumber = phoneNumber.replace(/^\+/, '');
      const code = await sock.requestPairingCode(cleanNumber);
      if (code) {
        const country = detectCountry(phoneNumber);
        await bot.sendMessage(chatId, `
╰┈➤ Pairing Code Generated 👀

Number : ${phoneNumber}
Country: ${country}
Code   : ${code}

⏳ Waiting for WhatsApp confirmation...

📱 Steps:
1. WhatsApp → Settings → Linked Devices
2. Tap "Link a Device"
3. Enter code: ${code}
4. Confirm on phone

⚠️ Code expires in 60 seconds.
        `);

        sock.ev.on('connection.update', async (update) => {
          const { connection } = update;
          if (connection === 'open') {
            console.log(`✅ Connected via pairing: ${phoneNumber}`);
            activeWABots.set(chatId, sock);
            userSessions.set(chatId, { phoneNumber, status: 'connected', country });
            await bot.sendMessage(chatId, `✅ Connected! Type .menu to use the bot.`);
          }
        });
        sock.ev.on('creds.update', saveCreds);
        return; // Pairing succeeded
      } else {
        throw new Error('No code received');
      }
    } catch (pairError) {
      // ---------- PAIRING FAILED → QR FALLBACK ----------
      console.log('Pairing failed, falling back to QR:', pairError.message);
      await bot.sendMessage(chatId, `
⚠️ Pairing code not available for your region.  
🔄 Generating QR code... (works everywhere)
      `);

      sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        if (qr) {
          try {
            const qrImage = await QRCode.toBuffer(qr);
            const country = detectCountry(phoneNumber);
            await bot.sendPhoto(chatId, qrImage, {
              caption: `
✅ QR Code Ready!

Number : ${phoneNumber}
Country: ${country}

📱 Instructions:
1. WhatsApp → Settings → Linked Devices
2. Tap "Link a Device"
3. Scan this QR code with your phone

⏳ Waiting for connection...
`
            });
          } catch (qrErr) {
            console.error('QR generation error:', qrErr);
            await bot.sendMessage(chatId, `❌ QR error: ${qrErr.message}`);
          }
        }
        if (connection === 'open') {
          console.log(`✅ Connected via QR: ${phoneNumber}`);
          activeWABots.set(chatId, sock);
          userSessions.set(chatId, { phoneNumber, status: 'connected', country: detectCountry(phoneNumber) });
          await bot.sendMessage(chatId, `✅ Connected! Type .menu to use the bot.`);
        }
      });
      sock.ev.on('creds.update', saveCreds);
    }

  } catch (error) {
    console.error('Session error:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

// ---------- .qr COMMAND (Force QR only) ----------
const forceQRMode = new Map();

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text.startsWith('/')) return;

  if (text === '.qr') {
    forceQRMode.set(chatId, true);
    return bot.sendMessage(chatId, '✅ Force QR mode ON. Now send your phone number – I will generate only QR code.');
  }

  // If it's a command starting with '.' other than .qr, handle later
  if (text.startsWith('.')) {
    // We'll handle commands after connection is established – see later handler
    return;
  }

  // If not a command, process as phone number
  if (!text) return;

  try {
    await bot.sendMessage(chatId, '⏳ Connecting...');
    if (forceQRMode.get(chatId)) {
      await generateQROnly(text, chatId);
      forceQRMode.delete(chatId);
    } else {
      await generatePairingOrQR(text, chatId);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// ---------- QR ONLY FUNCTION ----------
async function generateQROnly(phoneNumber, chatId) {
  try {
    const sessionName = `SIMON_${Date.now()}`;
    const sessionPath = path.join(sessionsDir, sessionName);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SIMON TECH BOT2', 'Windows', '1.0'],
      qrTimeout: 60000,
      logger: { level: 'error', log: () => {} },
    });

    activeSockets.set(chatId, sock);

    sock.ev.on('connection.update', async (update) => {
      const { qr, connection } = update;
      if (qr) {
        try {
          const qrImage = await QRCode.toBuffer(qr);
          const country = detectCountry(phoneNumber);
          await bot.sendPhoto(chatId, qrImage, {
            caption: `
✅ QR Code Ready!

Number : ${phoneNumber}
Country: ${country}

📱 Scan with WhatsApp → Settings → Linked Devices → Link a Device
`
          });
        } catch (qrErr) {
          console.error('QR error:', qrErr);
          await bot.sendMessage(chatId, `❌ QR error: ${qrErr.message}`);
        }
      }
      if (connection === 'open') {
        console.log(`✅ Connected via QR: ${phoneNumber}`);
        activeWABots.set(chatId, sock);
        userSessions.set(chatId, { phoneNumber, status: 'connected', country: detectCountry(phoneNumber) });
        await bot.sendMessage(chatId, `✅ Connected! Type .menu to use bot.`);
      }
    });
    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('QR session error:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

// ---------- COMMAND HANDLER FOR CONNECTED USERS ----------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Only process if user has an active WhatsApp connection
  if (!activeWABots.has(chatId)) return;

  // Menu
  if (text === '.menu' || text === '.help') {
    return bot.sendMessage(chatId, MENUS.main);
  }

  // Category shortcuts (1-19)
  const categoryMap = {
    '1': 'owner', '2': 'system', '3': 'profile', '4': 'group',
    '5': 'security', '6': 'ai', '7': 'download', '8': 'media',
    '9': 'games', '10': 'economy', '11': 'bank', '12': 'anime',
    '13': 'search', '14': 'tools', '15': 'internet',
    '16': 'design', '17': 'education', '18': 'cloud', '19': 'developer'
  };

  if (text in categoryMap) {
    const key = categoryMap[text];
    if (MENUS[key]) return bot.sendMessage(chatId, MENUS[key]);
  }

  // Direct command .owner, .system, etc.
  const cmd = text.slice(1).split(' ')[0];
  if (cmd && MENUS[cmd]) {
    return bot.sendMessage(chatId, MENUS[cmd]);
  }

  // Ping
  if (text === '.ping') {
    const start = Date.now();
    await bot.sendMessage(chatId, '🏓 Pong!');
    return bot.sendMessage(chatId, `⚡ Speed: ${Date.now() - start}ms`);
  }

  // Alive
  if (text === '.alive') {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    return bot.sendMessage(chatId, `
✅ Bot Status: ONLINE
🟢 WhatsApp: Connected
⏱ Uptime: ${h}h ${m}m
👑 Owner: SIMON TECH
📱 Version: 2.0.0
Type .menu for commands.
`);
  }

  // Unknown command
  if (text.startsWith('.')) {
    return bot.sendMessage(chatId, `❓ Command not found: ${text}\nType .menu for available commands.`);
  }
});

// ---------- OTHER TELEGRAM COMMANDS ----------
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
╔════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 - HELP         ║
╚════════════════════════════════════╝

/start – Begin linking (pairing first, QR fallback)
/help – Show this
/status – Check session
/reset – Reset and start over
.qr – Force QR only (no pairing attempt)

Linking works in all countries!
`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  if (session) {
    bot.sendMessage(chatId, `
╰┈➤ Session Status
Number : ${session.phoneNumber || 'N/A'}
Status : ${session.status === 'connected' ? '✅ Connected' : '⏳ Connecting...'}
Country: ${session.country || 'Unknown'}
`);
  } else {
    bot.sendMessage(chatId, '❌ No active session. Use /start to begin.');
  }
});

bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  if (activeSockets.has(chatId)) {
    activeSockets.get(chatId).end(new Error('Reset'));
    activeSockets.delete(chatId);
  }
  if (activeWABots.has(chatId)) {
    activeWABots.get(chatId).end(new Error('Reset'));
    activeWABots.delete(chatId);
  }
  userSessions.delete(chatId);
  forceQRMode.delete(chatId);
  bot.sendMessage(chatId, '✅ Session reset. Use /start to link again.');
});

// ---------- ERROR HANDLING ----------
bot.on('polling_error', (error) => console.error('Polling error:', error));

// ---------- GRACEFUL SHUTDOWN ----------
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  activeSockets.forEach(sock => sock.end(new Error('Shutdown')));
  activeWABots.forEach(sock => sock.end(new Error('Shutdown')));
  server.close(() => process.exit(0));
});

console.log('✅ SIMON TECH BOT2 started (No number validation – any format accepted)');
console.log('📱 Works in all countries with pairing or QR fallback.');

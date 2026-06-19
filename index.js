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
app.get('/', (req, res) => res.status(200).json({ status: 'OK' }));
app.get('/health', (req, res) => res.status(200).json({ healthy: true }));
app.get('/status', (req, res) => res.status(200).json({ status: 'online', version: '2.0.0' }));
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal Server Error' }));

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => console.log(`✅ HTTP Server running on port ${PORT}`));

// ---------- TELEGRAM BOT ----------
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ---------- SESSIONS ----------
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const userSessions = new Map();
const activeSockets = new Map();
const activeWABots = new Map();
const processing = new Map(); // prevent duplicate requests

// ---------- HELPERS ----------
function detectCountry(phoneNumber) {
  const clean = phoneNumber.replace(/^\+/, '');
  const map = {
    '92': '🇵🇰 Pakistan', '44': '🇬🇧 UK', '91': '🇮🇳 India',
    '234': '🇳🇬 Nigeria', '233': '🇬🇭 Ghana', '255': '🇹🇿 Tanzania',
    '256': '🇺🇬 Uganda', '254': '🇰🇪 Kenya', '27': '🇿🇦 South Africa',
    '55': '🇧🇷 Brazil', '212': '🇲🇦 Morocco', '971': '🇦🇪 UAE',
    '86': '🇨🇳 China'
  };
  for (const [code, country] of Object.entries(map)) {
    if (clean.startsWith(code)) return country;
  }
  return '🌍 Unknown';
}

// ---------- MENUS (Short – replace with full if needed) ----------
const MENUS = {
  main: `
╔════════════════════════════════════╗
║   🤖 SIMON TECH BOT - MAIN MENU    ║
║    ⚡ ULTIMATE EDITION ⚡          ║
╚════════════════════════════════════╝
├⊷ 👑 OWNER (50)  ├⊷ ⚙️ SYSTEM (50)
├⊷ 👤 PROFILE (40)├⊷ 👥 GROUP (80)
├⊷ 🔐 SECURITY (60)├⊷ 🧠 AI (100)
├⊷ 📥 DOWNLOAD (80)├⊷ 🖼️ MEDIA (60)
├⊷ 🎮 GAMES (80)  ├⊷ 💰 ECONOMY (80)
├⊷ 🏦 BANK (40)   ├⊷ 🎭 ANIME (40)
├⊷ 🔍 SEARCH (40) ├⊷ 🛠️ TOOLS (50)
├⊷ 🌐 INTERNET (30)├⊷ 🎨 DESIGN (30)
├⊷ 📚 EDUCATION (30)├⊷ ☁️ CLOUD (20)
├⊷ 🚀 DEVELOPER (20)
├⊷ 📊 TOTAL: 800+  ├⊷ VERSION: 2.0.0
├⊷ 👑 OWNER: SIMON TECH  ├⊷ STATUS: 🟢 ONLINE
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
Reply with category number (1-19) to see commands.
`
};

// ---------- START COMMAND ----------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
╔══════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 👀              ║
║    WhatsApp Linking (QR Only)        ║
╚══════════════════════════════════════╝

📱 **Linking via QR Code**

1️⃣ Send your WhatsApp number (with country code)  
   Example: 923124001592 (Pakistan)  
   or +447911123456 (UK)

2️⃣ I will generate a **QR code** for you.

3️⃣ Open WhatsApp → Settings → Linked Devices  
   Tap "Link a Device" and scan the QR code.

✅ Works in all countries – no restrictions!

📤 Send your phone number now:
`);
});

// ---------- HANDLE MESSAGES ----------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text.startsWith('/')) return;

  // If it's a command starting with '.' and user is connected, handle later
  if (text.startsWith('.')) return;

  if (!text) return;

  // Prevent multiple simultaneous processing
  if (processing.get(chatId)) {
    return bot.sendMessage(chatId, '⏳ Already processing your request. Please wait...');
  }
  processing.set(chatId, true);

  try {
    await bot.sendMessage(chatId, '⏳ Generating QR code...');
    await generateQRCode(text, chatId);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  } finally {
    processing.delete(chatId);
  }
});

// ---------- QR CODE GENERATION (ONLY QR, NO PAIRING) ----------
async function generateQRCode(phoneNumber, chatId) {
  try {
    const sessionName = `SIMON_${Date.now()}`;
    const sessionPath = path.join(sessionsDir, sessionName);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // Create socket with proper logger
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SIMON TECH BOT2', 'Windows', '1.0'],
      qrTimeout: 120000, // 2 minutes
      logger: {
        level: 'error',
        child: () => this,
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
        trace: () => {}
      }
    });

    activeSockets.set(chatId, sock);

    let qrSent = false;

    // Listen for QR event
    sock.ev.on('connection.update', async (update) => {
      const { qr, connection, lastDisconnect } = update;

      if (qr && !qrSent) {
        qrSent = true;
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

⏳ Waiting for connection... (QR valid for 2 minutes)
`
          });
          // Remove listener to avoid duplicate
          sock.ev.removeAllListeners('connection.update');
        } catch (qrErr) {
          console.error('QR generation error:', qrErr);
          await bot.sendMessage(chatId, `❌ QR error: ${qrErr.message}`);
        }
      }

      if (connection === 'open') {
        console.log(`✅ Connected for ${phoneNumber}`);
        activeWABots.set(chatId, sock);
        userSessions.set(chatId, { phoneNumber, status: 'connected', country: detectCountry(phoneNumber) });
        await bot.sendMessage(chatId, `✅ Connected! Type .menu to use the bot.`);
        sock.ev.removeAllListeners('connection.update');
      }

      if (lastDisconnect && lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
        await bot.sendMessage(chatId, '⚠️ Session logged out. Re-link using /start.');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // If QR doesn't come within 30 seconds, send a reminder
    setTimeout(() => {
      if (!qrSent && !userSessions.get(chatId)?.status === 'connected') {
        bot.sendMessage(chatId, '⏳ Still waiting for QR to generate... If it takes too long, try sending your number again.');
      }
    }, 30000);

  } catch (error) {
    console.error('Session error:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

// ---------- COMMAND HANDLER FOR CONNECTED USERS ----------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (!activeWABots.has(chatId)) return;

  if (text === '.menu' || text === '.help') {
    return bot.sendMessage(chatId, MENUS.main);
  }

  // Category shortcuts 1-19
  const catMap = {
    '1':'owner','2':'system','3':'profile','4':'group','5':'security',
    '6':'ai','7':'download','8':'media','9':'games','10':'economy',
    '11':'bank','12':'anime','13':'search','14':'tools','15':'internet',
    '16':'design','17':'education','18':'cloud','19':'developer'
  };
  if (text in catMap) {
    const key = catMap[text];
    if (MENUS[key]) return bot.sendMessage(chatId, MENUS[key]);
  }

  const cmd = text.slice(1).split(' ')[0];
  if (cmd && MENUS[cmd]) {
    return bot.sendMessage(chatId, MENUS[cmd]);
  }

  if (text === '.ping') {
    const start = Date.now();
    await bot.sendMessage(chatId, '🏓 Pong!');
    return bot.sendMessage(chatId, `⚡ Speed: ${Date.now() - start}ms`);
  }

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

  if (text.startsWith('.')) {
    return bot.sendMessage(chatId, `❓ Command not found: ${text}\nType .menu for available commands.`);
  }
});

// ---------- OTHER COMMANDS ----------
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
/start – Begin linking (QR only)
/help – Show this
/status – Check session
/reset – Reset and start over
`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const s = userSessions.get(chatId);
  if (s) {
    bot.sendMessage(chatId, `
Number : ${s.phoneNumber}
Status : ${s.status === 'connected' ? '✅ Connected' : '⏳ Connecting...'}
Country: ${s.country || 'Unknown'}
`);
  } else {
    bot.sendMessage(chatId, '❌ No active session. Use /start.');
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
  processing.delete(chatId);
  bot.sendMessage(chatId, '✅ Session reset. Use /start to link again.');
});

// ---------- ERROR & SHUTDOWN ----------
bot.on('polling_error', (error) => console.error('Polling error:', error));

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  activeSockets.forEach(s => s.end(new Error('Shutdown')));
  activeWABots.forEach(s => s.end(new Error('Shutdown')));
  server.close(() => process.exit(0));
});

console.log('✅ SIMON TECH BOT2 started – QR only mode, works globally!');

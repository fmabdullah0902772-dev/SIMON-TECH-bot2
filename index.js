const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const QRCode = require('qrcode');

// Express HTTP Server for Railway Healthcheck
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

// Bot Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// WhatsApp session storage
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// User tracking
const userSessions = new Map();
const activeSockets = new Map();
const activeWABots = new Map();

// Helper: Validate phone number format
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
  return phoneRegex.test(phoneNumber);
}

// (Country detection optional – we keep it for display)
function detectCountry(phoneNumber) {
  const countryMap = {
    '+92': '🇵🇰 Pakistan',
    '+44': '🇬🇧 UK',
    '+91': '🇮🇳 India',
    '+234': '🇳🇬 Nigeria',
    '+233': '🇬🇭 Ghana',
    '+255': '🇹🇿 Tanzania',
    '+256': '🇺🇬 Uganda',
    '+254': '🇰🇪 Kenya',
    '+27': '🇿🇦 South Africa',
    '+55': '🇧🇷 Brazil',
    '+212': '🇲🇦 Morocco',
    '+971': '🇦🇪 UAE',
    '+86': '🇨🇳 China',
  };
  for (const [code, country] of Object.entries(countryMap)) {
    if (phoneNumber.startsWith(code)) {
      return country;
    }
  }
  return '🌍 Unknown';
}

// ------ MENUS (same as before, unchanged) ------
const MENUS = {
  main: `
╔════════════════════════════════════╗
║   🤖 SIMON TECH BOT - MAIN MENU    ║
║    ⚡ ULTIMATE EDITION ⚡          ║
╚════════════════════════════════════╝

├⊷ 👑 OWNER (50 COMMANDS)
├⊷ ⚙️ SYSTEM (50 COMMANDS)
├⊷ 👤 PROFILE (40 COMMANDS)
├⊷ 👥 GROUP (80 COMMANDS)
├⊷ 🔐 SECURITY (60 COMMANDS)
├⊷ 🧠 AI (100 COMMANDS)
├⊷ 📥 DOWNLOADER (80 COMMANDS)
├⊷ 🖼️ MEDIA (60 COMMANDS)
├⊷ 🎮 GAMES (80 COMMANDS)
├⊷ 💰 ECONOMY (80 COMMANDS)
├⊷ 🏦 BANK (40 COMMANDS)
├⊷ 🎭 ANIME (40 COMMANDS)
├⊷ 🔍 SEARCH (40 COMMANDS)
├⊷ 🛠️ TOOLS (50 COMMANDS)
├⊷ 🌐 INTERNET (30 COMMANDS)
├⊷ 🎨 DESIGN (30 COMMANDS)
├⊷ 📚 EDUCATION (30 COMMANDS)
├⊷ ☁️ CLOUD (20 COMMANDS)
├⊷ 🚀 DEVELOPER (20 COMMANDS)

├⊷ 📊 TOTAL COMMANDS: 800+
├⊷ 🤖 BOT TYPE: Multi Device
├⊷ ⚡ VERSION: 2.0.0
├⊷ 👑 OWNER: SIMON TECH
├⊷ 🚀 STATUS: ONLINE 🟢
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

*Reply with category number to see commands*
  1. Owner | 2. System | 3. Profile
  4. Group | 5. Security | 6. AI
  7. Download | 8. Media | 9. Games
  10. Economy | 11. Bank | 12. Anime
  13. Search | 14. Tools | 15. Internet
  16. Design | 17. Education | 18. Cloud
  19. Developer
`,
  // ... (all other menus remain same, copy from previous code) 
  // For brevity, I'll include them later, but you can keep your existing MENUS object.
};

// ------ START COMMAND ------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const startMessage = `
╔══════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 👀              ║
║    WhatsApp Linking via QR Code      ║
╚══════════════════════════════════════╝

📱 **Linking Process (No Country Block)**

1️⃣ Send your WhatsApp phone number with country code  
   Example: +1234567890

2️⃣ I will generate a **QR code** for you.

3️⃣ Open WhatsApp → Settings → Linked Devices → Link a Device  
   Scan the QR code with your phone.

✅ That's it – your WhatsApp is linked!

📤 Reply with your phone number to continue:
`;
  bot.sendMessage(chatId, startMessage);
});

// ------ HANDLE PHONE NUMBER INPUT ------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Skip commands
  if (text.startsWith('/') || text.startsWith('.')) return;

  // Validate phone number
  if (!validatePhoneNumber(text)) {
    const errorMsg = `
❌ Invalid format!

Please use format: +1234567890

Examples:
• +1234567890 (USA)
• +234XXXXXXXXXX (Nigeria)
• +44XXXXXXXXXX (UK)
• +91XXXXXXXXXX (India)

📤 Send a valid phone number with country code:
`;
    return bot.sendMessage(chatId, errorMsg);
  }

  try {
    await bot.sendMessage(chatId, '⏳ Generating QR code... Please wait.');
    await generateQRCode(text, chatId);
  } catch (error) {
    console.error('Error:', error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}\nPlease try again.`);
  }
});

// ------ GENERATE QR CODE (NO PAIRING CODE) ------
async function generateQRCode(phoneNumber, chatId) {
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

    // Listen for QR code
    sock.ev.on('connection.update', async (update) => {
      const { qr, connection } = update;

      if (qr) {
        console.log('QR Code generated for', phoneNumber);
        try {
          const qrImage = await QRCode.toBuffer(qr);
          const country = detectCountry(phoneNumber);
          await bot.sendPhoto(chatId, qrImage, {
            caption: `
✅ QR Code generated!

📱 **Instructions:**
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan this QR code with your phone

📌 Number: ${phoneNumber}
🌍 Country: ${country}

⏳ Waiting for connection...
`
          });
        } catch (qrError) {
          console.error('QR image error:', qrError);
          await bot.sendMessage(chatId, `❌ Could not generate QR image: ${qrError.message}`);
        }
      }

      if (connection === 'open') {
        console.log(`✅ WhatsApp connected for ${phoneNumber}`);
        activeWABots.set(chatId, sock);
        const session = userSessions.get(chatId);
        if (session) session.status = 'connected';
        else userSessions.set(chatId, { phoneNumber, status: 'connected', country: detectCountry(phoneNumber) });

        await bot.sendMessage(chatId, `
✅ **Connection Successful!**

[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ Number : ${phoneNumber}
╰┈➤ Status : ✅ Connected

✅ Your WhatsApp account is now linked!

Type **.menu** to see all available commands (800+).
`);
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle disconnection
    sock.ev.on('connection.update', (update) => {
      const { lastDisconnect } = update;
      if (lastDisconnect) {
        const reason = lastDisconnect.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          bot.sendMessage(chatId, '⚠️ Session logged out. Please re-link using /start.');
        }
      }
    });

  } catch (error) {
    console.error('WhatsApp session error:', error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error.message}\n\nPlease ensure:\n• Your phone number is correct\n• WhatsApp is installed and updated\n• Your phone is connected to the internet`
    );
  }
}

// ------ .qr COMMAND (force QR) ------
bot.onText(/^\.qr$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `
📱 **QR Code Linking**

Please send your phone number (with country code) to generate a QR code.

Example: +1234567890

After you send the number, I'll generate a QR code for you to scan.
`);
  // The next message with number will be caught by the main handler.
});

// ------ COMMAND HANDLER FOR CONNECTED USERS ------
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (activeWABots.has(chatId)) {
    // Handle .menu, .ping, .alive, categories, etc.
    // (Same as before – keep your existing command handling)
    // For brevity, I'll include a simplified version, but you can copy your old one.
    if (text === '.menu' || text === '.help') {
      await bot.sendMessage(chatId, MENUS.main);
    }
    // ... other commands ...
  }
});

// ------ HELP, STATUS, RESET (same as before) ------
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
╔════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 - HELP         ║
╚════════════════════════════════════╝

📚 Available Commands:

/start – Start linking via QR code
/help – Show this help
/status – Check session status
/reset – Reset and start over
.qr – Force QR code generation

📱 How to link:
1. Send /start
2. Reply with your phone number (+1234567890)
3. Scan the QR code with WhatsApp

⚠️ No country restrictions – QR works everywhere!
`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
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
  bot.sendMessage(chatId, '✅ Session reset. Use /start to link again.');
});

// Error handling
bot.on('polling_error', (error) => console.error('Polling error:', error));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  activeSockets.forEach(sock => sock.end(new Error('Shutdown')));
  activeWABots.forEach(sock => sock.end(new Error('Shutdown')));
  server.close(() => process.exit(0));
});

console.log('✅ SIMON TECH BOT2 started (QR only)');

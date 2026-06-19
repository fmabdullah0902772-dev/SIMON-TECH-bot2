const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');

// Express HTTP Server for Railway Healthcheck
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SIMON TECH BOT2 is running' });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    version: '2.0.0',
    botName: 'SIMON TECH BOT2',
    uptime: process.uptime()
  });
});

// Health check endpoint (Railway specific)
app.get('/health', (req, res) => {
  res.status(200).json({ healthy: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start HTTP Server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
});

// Bot Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const PREFIX = '.';

// Initialize Telegram Bot
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

// Helper: Format country code detection
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
  return '🌍 Country unknown';
}

// Helper: Validate phone number format
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
  return phoneRegex.test(phoneNumber);
}

// Command Menus
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

  owner: `
╭⊷ 『 👑 OWNER COMMANDS 』
├⊷ .restart - Restart bot
├⊷ .shutdown - Shutdown bot
├⊷ .reboot - Reboot system
├⊷ .updatebot - Update bot
├⊷ .deploy - Deploy bot
├⊷ .backup - Backup data
├⊷ .restore - Restore data
├⊷ .backupdb - Backup database
├⊷ .restoredb - Restore database
├⊷ .logs - View logs
├⊷ .clearlogs - Clear logs
├⊷ .broadcast - Broadcast message
├⊷ .bcgroup - Broadcast to groups
├⊷ .bcall - Broadcast to all
├⊷ .ban - Ban user
├⊷ .unban - Unban user
├⊷ .block - Block user
├⊷ .unblock - Unblock user
├⊷ .premium - Make user premium
├⊷ .unpremium - Remove premium
├⊷ .addowner - Add owner
├⊷ .delowner - Delete owner
├⊷ .setpp - Set profile picture
├⊷ .setnamebot - Set bot name
├⊷ .setstatus - Set bot status
├⊷ .setprefix - Set bot prefix
├⊷ .public - Public mode
├⊷ .private - Private mode
├⊷ .maintenance - Maintenance mode
├⊷ .anticall - Anti call mode
├⊷ .join - Join group
├⊷ .leave - Leave group
├⊷ .clearsession - Clear sessions
├⊷ .getsession - Get session
├⊷ .pair - Pair new device
├⊷ .unpair - Unpair device
├⊷ .eval - Execute code
├⊷ .exec - Execute command
├⊷ .terminal - Open terminal
├⊷ .shell - Shell access
├⊷ .serverrestart - Restart server
├⊷ .serverinfo - Server info
├⊷ .getplugin - Get plugin
├⊷ .addplugin - Add plugin
├⊷ .delplugin - Delete plugin
├⊷ .reload - Reload system
├⊷ .saveconfig - Save config
├⊷ .resetconfig - Reset config
├⊷ .ownerpanel - Owner panel
├⊷ .fullbackup - Full backup
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  system: `
╭⊷ 『 ⚙️ SYSTEM COMMANDS 』
├⊷ .menu - Show menu
├⊷ .help - Show help
├⊷ .ping - Check speed
├⊷ .alive - Bot status
├⊷ .status - System status
├⊷ .runtime - Runtime info
├⊷ .uptime - Bot uptime
├⊷ .speed - Speed test
├⊷ .version - Bot version
├⊷ .about - About bot
├⊷ .info - Bot info
├⊷ .owner - Owner info
├⊷ .support - Support info
├⊷ .script - Get script
├⊷ .report - Report bug
├⊷ .bug - Report bug
├⊷ .feedback - Send feedback
├⊷ .memory - Memory usage
├⊷ .cpu - CPU usage
├⊷ .ram - RAM usage
├⊷ .disk - Disk usage
├⊷ .network - Network info
├⊷ .connection - Connection status
├⊷ .latency - Latency check
├⊷ .battery - Battery status
├⊷ .health - System health
├⊷ .stats - System stats
├⊷ .dashboard - Dashboard
├⊷ .checkupdate - Check update
├⊷ .features - Show features
├⊷ .modules - Show modules
├⊷ .commands - Total commands
├⊷ .category - Show categories
├⊷ .news - Bot news
├⊷ .announcement - Announcements
├⊷ .rules - Bot rules
├⊷ .privacy - Privacy policy
├⊷ .terms - Terms of service
├⊷ .invite - Invite link
├⊷ .donate - Donate
├⊷ .premiuminfo - Premium info
├⊷ .ownerinfo - Owner info
├⊷ .credits - Bot credits
├⊷ .uptimefull - Full uptime
├⊷ .system - System check
├⊷ .diagnostics - Run diagnostics
├⊷ .processes - Show processes
├⊷ .threads - Show threads
├⊷ .queue - Show queue
├⊷ .sysreport - System report
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  ai: `
╭⊷ 『 🧠 AI COMMANDS 』
├⊷ .ai - AI chat
├⊷ .chat - Chat with AI
├⊷ .ask - Ask AI
├⊷ .gpt - GPT command
├⊷ .assistant - AI assistant
├⊷ .brain - AI brain
├⊷ .think - AI think
├⊷ .reason - AI reason
├⊷ .answer - Get answer
├⊷ .solve - Solve problem
├⊷ .codeai - AI code generator
├⊷ .fixcode - Fix code
├⊷ .debug - Debug code
├⊷ .optimize - Optimize code
├⊷ .generatecode - Generate code
├⊷ .htmlai - HTML generator
├⊷ .cssai - CSS generator
├⊷ .jsai - JavaScript generator
├⊷ .pythonai - Python generator
├⊷ .imageai - Image generator
├⊷ .imagine - Imagine image
├⊷ .art - AI art
├⊷ .draw - Draw image
├⊷ .logoai - Logo generator
├⊷ .avatarai - Avatar generator
├⊷ .translateai - AI translate
├⊷ .grammar - Grammar check
├⊷ .rewrite - Rewrite text
├⊷ .summarize - Summarize text
├⊷ .essay - Generate essay
├⊷ .article - Generate article
├⊷ .story - Generate story
├⊷ .poem - Generate poem
├⊷ .lyrics - Generate lyrics
├⊷ .caption - Generate caption
├⊷ .emailai - Email generator
├⊷ .teacher - AI teacher
├⊷ .mathai - Math solver
├⊷ .physicsai - Physics solver
├⊷ .chemistryai - Chemistry solver
├⊷ .biologyai - Biology solver
├⊷ .historyai - History info
├⊷ .examai - Exam helper
├⊷ .careerai - Career advisor
├⊷ .financeai - Finance advisor
├⊷ .cryptoai - Crypto analyzer
├⊷ .researchai - Research helper
├⊷ .analyze - Analyze data
├⊷ .forecast - Forecast data
├⊷ .planner - AI planner
├⊷ .travelai - Travel advisor
├⊷ .fitnessai - Fitness trainer
├⊷ .recipeai - Recipe generator
├⊷ .movieai - Movie recommender
├⊷ .animeai - Anime recommender
├⊷ .gameai - Game recommender
├⊷ .jokeai - Joke generator
├⊷ .coach - AI coach
├⊷ .mentor - AI mentor
├⊷ .brainstorm - Brainstorm ideas
├⊷ .compare - Compare items
├⊷ .explain - Explain topic
├⊷ .factcheck - Fact check
├⊷ .knowledge - Knowledge base
├⊷ .searchai - AI search
├⊷ .vision - Vision analysis
├⊷ .voiceai - Voice AI
├⊷ .smartchat - Smart chat
├⊷ .genius - Genius mode
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  download: `
╭⊷ 『 📥 DOWNLOAD COMMANDS 』
├⊷ .play - Play music
├⊷ .song - Download song
├⊷ .video - Download video
├⊷ .ytmp3 - YouTube to MP3
├⊷ .ytmp4 - YouTube to MP4
├⊷ .ytaudio - YouTube audio
├⊷ .ytvideo - YouTube video
├⊷ .tiktok - TikTok download
├⊷ .instagram - Instagram download
├⊷ .facebook - Facebook download
├⊷ .twitter - Twitter download
├⊷ .spotify - Spotify download
├⊷ .pinterest - Pinterest download
├⊷ .mediafire - MediaFire download
├⊷ .apk - APK download
├⊷ .playstore - PlayStore app
├⊷ .githubdl - GitHub download
├⊷ .gdrive - Google Drive download
├⊷ .mega - Mega download
├⊷ .download - Generic download
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  games: `
╭⊷ 『 🎮 GAMES COMMANDS 』
├⊷ .tictactoe - Tic Tac Toe
├⊷ .hangman - Hangman game
├⊷ .guess - Guess game
├⊷ .riddle - Riddle game
├⊷ .mathgame - Math game
├⊷ .quizgame - Quiz game
├⊷ .trivia - Trivia game
├⊷ .memorygame - Memory game
├⊷ .snake - Snake game
├⊷ .chess - Chess game
├⊷ .checkers - Checkers game
├⊷ .roulette - Roulette game
├⊷ .blackjack - Blackjack game
├⊷ .slots - Slots game
├⊷ .poker - Poker game
├⊷ .coinflip - Coin flip
├⊷ .dice - Dice roll
├⊷ .adventure - Adventure game
├⊷ .battle - Battle game
├⊷ .arena - Arena game
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  group: `
╭⊷ 『 👥 GROUP COMMANDS 』
├⊷ .groupinfo - Group info
├⊷ .grouplink - Group link
├⊷ .revoke - Revoke link
├⊷ .resetlink - Reset link
├⊷ .groupname - Set group name
├⊷ .groupdesc - Set description
├⊷ .groupicon - Set group icon
├⊷ .groupopen - Open group
├⊷ .groupclose - Close group
├⊷ .groupsettings - Group settings
├⊷ .tagall - Tag all members
├⊷ .hidetag - Hide tag
├⊷ .admins - List admins
├⊷ .members - List members
├⊷ .add - Add member
├⊷ .kick - Kick member
├⊷ .promote - Make admin
├⊷ .demote - Remove admin
├⊷ .mute - Mute group
├⊷ .unmute - Unmute group
├⊷ .warn - Warn member
├⊷ .warnings - View warnings
├⊷ .resetwarn - Reset warning
├⊷ .banmember - Ban member
├⊷ .unbanmember - Unban member
├⊷ .welcome - Set welcome
├⊷ .goodbye - Set goodbye
├⊷ .antilink - Anti link
├⊷ .antispam - Anti spam
├⊷ .antibot - Anti bot
├⊷ .antifake - Anti fake
├⊷ .antidelete - Anti delete
├⊷ .antitoxic - Anti toxic
├⊷ .antiraid - Anti raid
├⊷ .antiflood - Anti flood
├⊷ .autosticker - Auto sticker
├⊷ .autoreact - Auto react
├⊷ .autowarn - Auto warn
├⊷ .autokick - Auto kick
├⊷ .vote - Start vote
├⊷ .poll - Create poll
├⊷ .gstatus - Group status
├⊷ .gevent - Group events
├⊷ .event - Event manager
├⊷ .announce - Announce
├⊷ .schedule - Schedule message
├⊷ .slowmode - Slow mode
├⊷ .lockchat - Lock chat
├⊷ .unlockchat - Unlock chat
├⊷ .clean - Clean chat
├⊷ .purge - Purge messages
├⊷ .pin - Pin message
├⊷ .unpin - Unpin message
├⊷ .rules - Show rules
├⊷ .setrules - Set rules
├⊷ .groupstats - Group stats
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  economy: `
╭⊷ 『 💰 ECONOMY COMMANDS 』
├⊷ .wallet - Your wallet
├⊷ .daily - Daily reward
├⊷ .weekly - Weekly reward
├⊷ .monthly - Monthly reward
├⊷ .work - Work for money
├⊷ .crime - Crime activity
├⊷ .beg - Beg for money
├⊷ .rob - Rob someone
├⊷ .shop - Open shop
├⊷ .buy - Buy item
├⊷ .sell - Sell item
├⊷ .market - Market info
├⊷ .trade - Trade items
├⊷ .gamble - Gamble money
├⊷ .bet - Place bet
├⊷ .lottery - Play lottery
├⊷ .richlist - Rich list
├⊷ .economy - Economy info
├⊷ .reward - Get reward
├⊷ .salary - Get salary
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  media: `
╭⊷ 『 🖼️ MEDIA COMMANDS 』
├⊷ .sticker - Make sticker
├⊷ .s - Sticker shortcut
├⊷ .take - Take sticker
├⊷ .attp - ATTP text effect
├⊷ .ttp - TTP text effect
├⊷ .emojimix - Mix emojis
├⊷ .toimg - Convert to image
├⊷ .togif - Convert to GIF
├⊷ .tovideo - Convert to video
├⊷ .cropsticker - Crop sticker
├⊷ .roundsticker - Round sticker
├⊷ .circle - Circle effect
├⊷ .trigger - Trigger effect
├⊷ .wasted - Wasted effect
├⊷ .rip - RIP effect
├⊷ .wanted - Wanted poster
├⊷ .jail - Jail effect
├⊷ .gay - Gay effect
├⊷ .glass - Glass effect
├⊷ .burn - Burn effect
├⊷ .image - Search image
├⊷ .video - Search video
├⊷ .audio - Search audio
├⊷ .mp3 - MP3 converter
├⊷ .mp4 - MP4 converter
├⊷ .vv - View once
├⊷ .tourl - Convert to URL
├⊷ .removebg - Remove background
├⊷ .enhance - Enhance image
├⊷ .hd - Make HD
├⊷ .resize - Resize image
├⊷ .compress - Compress image
├⊷ .blur - Blur image
├⊷ .invert - Invert colors
├⊷ .grayscale - Grayscale
├⊷ .gif - Create GIF
├⊷ .reversevideo - Reverse video
├⊷ .slowmo - Slow motion
├⊷ .fastvideo - Fast video
├⊷ .editmedia - Edit media
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,

  security: `
╭⊷ 『 🔐 SECURITY COMMANDS 』
├⊷ .security - Security check
├⊷ .scan - Scan threats
├⊷ .fullscan - Full scan
├⊷ .quickscan - Quick scan
├⊷ .securityreport - Security report
├⊷ .protection - Enable protection
├⊷ .firewall - Firewall settings
├⊷ .guard - Guard mode
├⊷ .shield - Shield mode
├⊷ .lock - Lock account
├⊷ .unlock - Unlock account
├⊷ .verify - Verify account
├⊷ .verification - Verification
├⊷ .captcha - Captcha verify
├⊷ .anticall - Anti call
├⊷ .antidelete - Anti delete
├⊷ .antiedit - Anti edit
├⊷ .blacklist - Blacklist users
├⊷ .whitelist - Whitelist users
├⊷ .banlist - Ban list
├⊷ .trusted - Trusted users
├⊷ .safemode - Safe mode
├⊷ .securemode - Secure mode
├⊷ .panicmode - Panic mode
├⊷ .emergency - Emergency mode
├⊷ .checklink - Check link
├⊷ .checkfile - Check file
├⊷ .risk - Risk analysis
├⊷ .threat - Threat detection
├⊷ .malware - Malware check
├⊷ .virus - Virus check
├⊷ .phishing - Phishing check
├⊷ .audit - Audit log
├⊷ .auditlog - Audit log view
├⊷ .monitor - Monitor activity
├⊷ .watchlist - Watch list
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,
};

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const startMessage = `
╔══════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 👀              ║
║    WhatsApp Linking Process          ║
╚══════════════════════════════════════╝

📱 WhatsApp Linking Process

1️⃣ Send your WhatsApp phone number (with country code)
   Example: +1234567890

2️⃣ You'll receive a REAL 8-digit linking code from WhatsApp

3️⃣ Enter that code in WhatsApp → Linked Devices

4️⃣ Done! Your WhatsApp is now linked.

📤 Reply with your phone number to continue:
`;

  bot.sendMessage(chatId, startMessage);
});

// Handle text messages (phone number input)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Skip if message is a command
  if (text.startsWith('/')) return;

  // Validate phone number format
  if (!validatePhoneNumber(text)) {
    const errorMsg = `
❌ ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ!

Please use format: +1234567890

Example formats:
• +1234567890 (USA)
• +234XXXXXXXXXX (Nigeria)
• +44XXXXXXXXXX (UK)
• +91XXXXXXXXXX (India)

📤 Please send your phone number with country code:
`;
    return bot.sendMessage(chatId, errorMsg);
  }

  try {
    // Show loading message
    await bot.sendMessage(chatId, '⏳ Requesting pairing code from WhatsApp...');

    // Generate real WhatsApp pairing code
    await generateWhatsAppPairingCode(text, chatId);

  } catch (error) {
    console.error('Error:', error);
    const errorMsg = `
❌ Error generating pairing code

Error: ${error.message}

Please try again with a valid phone number.
`;
    await bot.sendMessage(chatId, errorMsg);
  }
});

// Generate REAL WhatsApp Pairing Code
async function generateWhatsAppPairingCode(phoneNumber, chatId) {
  try {
    const sessionName = `SIMON_${Date.now()}`;
    const sessionPath = path.join(sessionsDir, sessionName);
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SIMON TECH BOT2', 'Windows', '1.0'],
      qrTimeout: 60000,
      logger: {
        level: 'error',
        log: () => {},
      },
    });

    // Store socket reference
    activeSockets.set(chatId, sock);

    // Wait for connection to initialize
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    // Request REAL pairing code from WhatsApp
    try {
      const code = await sock.requestPairingCode(phoneNumber);

      if (code) {
        // Store session info
        const userSession = {
          phoneNumber,
          country: detectCountry(phoneNumber),
          pairingCode: code,
          status: 'code_generated',
          sessionName,
          sock,
        };
        
        userSessions.set(chatId, userSession);

        // Display the REAL pairing code
        const responseMessage = `
╰┈➤ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘᴀɪʀ ᴄᴏᴅᴇ 👀

[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ ɴᴜᴍʙᴇʀ : ${phoneNumber}

╰┈➤ ᴄᴏᴜɴᴛʀʏ : ${userSession.country}

╰┈➤ ᴄᴏᴅᴇ : ${code}

[ Sᴇssɪᴏɴ Cᴏɴɴᴇᴄᴛɪɴɢ. ❤️‍🩹 ]

⏳ Waiting for WhatsApp linking confirmation...

💡 Steps:
1️⃣ Go to WhatsApp on your phone
2️⃣ Go to Settings → Linked Devices
3️⃣ Click "Link a Device"
4️⃣ Enter the pairing code: ${code}
5️⃣ Confirm on your phone

⚠️ This code expires in 60 seconds
`;

        await bot.sendMessage(chatId, responseMessage);

        // Listen for connection
        sock.ev.on('connection.update', async (update) => {
          const { connection } = update;

          if (connection === 'open') {
            console.log(`✅ WhatsApp connected for ${phoneNumber}`);

            // Store WhatsApp bot for command handling
            activeWABots.set(chatId, sock);

            const successMsg = `
✅ ᴄᴏɴɴᴇᴄᴛɪᴏɴ sᴜᴄᴄᴇssғᴜʟ!

[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ ɴᴜᴍʙᴇʀ : ${phoneNumber}

╰┈➤ sᴛᴀᴛᴜs : ✅ Connected

✅ Your WhatsApp account is now linked!

🎉 Bot is ready to use!

📝 Now you can use WhatsApp commands:

Type .menu to see all available commands!

Available Categories:
👑 Owner | ⚙️ System | 👤 Profile
👥 Group | 🔐 Security | 🧠 AI
📥 Download | 🖼️ Media | 🎮 Games
💰 Economy | 🏦 Bank | 🎭 Anime
🔍 Search | 🛠️ Tools | 🌐 Internet
🎨 Design | 📚 Education | ☁️ Cloud
🚀 Developer

📊 TOTAL: 800+ Commands
⚡ VERSION: 2.0.0
👑 OWNER: SIMON TECH
🚀 STATUS: ONLINE 🟢
`;

            await bot.sendMessage(chatId, successMsg);

            const session = userSessions.get(chatId);
            if (session) {
              session.status = 'connected';
            }
          }
        });

        sock.ev.on('creds.update', saveCreds);

      } else {
        await bot.sendMessage(chatId, '❌ Failed to generate pairing code. Please try again.');
      }

    } catch (pairingError) {
      console.error('Pairing error:', pairingError);
      
      // Try QR code as fallback
      sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;

        if (qr) {
          console.log('Fallback: QR Code generated');
          await bot.sendMessage(
            chatId,
            '❌ Could not generate phone pairing code.\n\n⚠️ Alternative: Please use the web session generator.\n\nThen scan the QR code with WhatsApp camera'
          );
        }

        if (connection === 'open') {
          const session = userSessions.get(chatId);
          if (session) {
            session.status = 'connected';
          }

          activeWABots.set(chatId, sock);

          await bot.sendMessage(chatId, '✅ WhatsApp connected via QR code!\n\nType .menu to see all commands!');

          setTimeout(() => {
            sock.end(new Error('Closed'));
            activeSockets.delete(chatId);
          }, 5000);
        }
      });
    }

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('WhatsApp session error:', error);
    
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error.message}\n\nPlease ensure:\n• Your phone number is correct\n• WhatsApp is installed and updated\n• Your phone is connected to the internet`
    );
  }
}

// WhatsApp Message Handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Check if this user has a connected WhatsApp bot
  if (activeWABots.has(chatId)) {
    const whatsappBot = activeWABots.get(chatId);

    // Handle menu command
    if (text === '.menu' || text === '.help') {
      await bot.sendMessage(chatId, MENUS.main);
    }

    // Handle category commands
    if (text === '1' || text === '.owner') {
      await bot.sendMessage(chatId, MENUS.owner);
    }
    if (text === '2' || text === '.system') {
      await bot.sendMessage(chatId, MENUS.system);
    }
    if (text === '6' || text === '.ai') {
      await bot.sendMessage(chatId, MENUS.ai);
    }
    if (text === '7' || text === '.download') {
      await bot.sendMessage(chatId, MENUS.download);
    }
    if (text === '9' || text === '.games') {
      await bot.sendMessage(chatId, MENUS.games);
    }
    if (text === '4' || text === '.group') {
      await bot.sendMessage(chatId, MENUS.group);
    }
    if (text === '10' || text === '.economy') {
      await bot.sendMessage(chatId, MENUS.economy);
    }
    if (text === '8' || text === '.media') {
      await bot.sendMessage(chatId, MENUS.media);
    }
    if (text === '5' || text === '.security') {
      await bot.sendMessage(chatId, MENUS.security);
    }

    // Handle .ping command
    if (text === '.ping') {
      const start = Date.now();
      await bot.sendMessage(chatId, '🏓 Pong!');
      const latency = Date.now() - start;
      await bot.sendMessage(chatId, `⚡ Speed: ${latency}ms`);
    }

    // Handle .alive command
    if (text === '.alive') {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      const aliveMsg = `
╔════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 STATUS         ║
╚════════════════════════════════════╝

✅ Bot Status: ONLINE
🟢 WhatsApp: Connected
⚡ Speed: Ultra Fast
🧠 System: Stable
📊 Uptime: ${hours}h ${minutes}m

✨ Features Active:
• AI Commands: Enabled ✅
• Download Features: Enabled ✅
• Games: Enabled ✅
• Economy: Enabled ✅
• Group Management: Enabled ✅
• Security: Enabled ✅
• Media Tools: Enabled ✅

👑 Owner: SIMON TECH
📱 Version: 2.0.0
🚀 Status: ONLINE 🟢

Type .menu for all commands!
`;

      await bot.sendMessage(chatId, aliveMsg);
    }

    // Handle unknown commands
    if (text.startsWith('.') && !['menu', 'help', 'ping', 'alive', 'system', 'owner', 'ai', 'download', 'games', 'group', 'economy', 'media', 'security'].includes(text.slice(1).split(' ')[0])) {
      await bot.sendMessage(chatId, `
❓ Command not found: ${text}

Type .menu to see all available commands!
      `);
    }
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
╔════════════════════════════════════╗
║   ♡ SIMON TECH BOT2 - HELP         ║
╚════════════════════════════════════╝

📚 Available Commands:

/start - Start the linking process
/help - Show this help message
/status - Check current session status
/reset - Reset and start over

❓ How to link WhatsApp:

1️⃣ Send /start
2️⃣ Reply with your phone number (+1234567890)
3️⃣ You'll get a REAL 8-digit pairing code
4️⃣ Enter it in WhatsApp Linked Devices
5️⃣ Connection confirmed!

⚠️ Important:
• Phone number must include country code
• Pairing code expires after 60 seconds
• Code is generated by WhatsApp servers
• Your account will be automatically linked
• Never share your phone number

🆘 Need help?
Contact: @simontech_official
`;

  bot.sendMessage(chatId, helpMessage);
});

// Status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;

  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
    const statusMessage = `
╰┈➤ sᴇssɪᴏɴ sᴛᴀᴛᴜs

[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ ɴᴜᴍʙᴇʀ : ${session.phoneNumber || 'N/A'}

╰┈➤ sᴛᴀᴛᴜs : ${session.status === 'connected' ? '✅ Connected' : '⏳ Connecting...'}

╰┈➤ ᴄᴏᴜɴᴛʀʏ : ${session.country || 'Unknown'}

${session.pairingCode ? `╰┈➤ ᴄᴏᴅᴇ : ${session.pairingCode}` : ''}
`;

    bot.sendMessage(chatId, statusMessage);
  } else {
    const noSessionMsg = `
❌ No session found

Start with /start to begin linking your WhatsApp account.
`;
    bot.sendMessage(chatId, noSessionMsg);
  }
});

// Reset command
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  
  // Close active socket
  if (activeSockets.has(chatId)) {
    const sock = activeSockets.get(chatId);
    sock.end(new Error('Reset'));
    activeSockets.delete(chatId);
  }
  
  if (activeWABots.has(chatId)) {
    const sock = activeWABots.get(chatId);
    sock.end(new Error('Reset'));
    activeWABots.delete(chatId);
  }
  
  userSessions.delete(chatId);

  const resetMsg = `
✅ Session reset!

Use /start to begin a new linking process.
`;

  bot.sendMessage(chatId, resetMsg);
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  activeSockets.forEach((sock) => {
    sock.end(new Error('Shutdown'));
  });
  activeWABots.forEach((sock) => {
    sock.end(new Error('Shutdown'));
  });
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Bot startup
console.log('✅ SIMON TECH BOT2 - Telegram Interface Started');
console.log('🤖 Bot is running and waiting for messages...');
console.log('📱 Make sure TELEGRAM_TOKEN is set in environment variables');
console.log(`🌐 HTTP Server available at port ${PORT}`);

bhi is code me na country error arha h kuch country block h isko unblock kr skty ho

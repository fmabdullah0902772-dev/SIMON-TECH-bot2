# 🤖 SIMON-TECH-BOT v2.0

A powerful WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys). Works on Windows, macOS, and Linux.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fsimontech-maxb%2FSIMON-TECH-Bot2&envs=SESSION_ID%2CBOT_NAME%2CBOT_PREFIX%2COWNER_NUMBER&optionalEnvs=SESSION_ID&SESSION_IDDescription=Your%20WhatsApp%20Session%20ID&BOT_NAMEDefault=SIMON&BOT_PREFIXDefault=.&OWNER_NUMBERDefault=2349166265317)

---

## ✨ Features

- ✅ **QR Code & Phone Number Pairing** - Two methods to connect WhatsApp
- ✅ **Fast Responses** - Lightning-quick bot replies
- ✅ **Auto Replies** - Smart message automation
- ✅ **Command System** - Easy-to-use prefix commands
- ✅ **Uptime Tracking** - Monitor bot performance
- ✅ **Group Support** - Works in groups and DMs
- ✅ **Easy Deployment** - Deploy to Railway with one click
- ✅ **Customizable** - Modify commands and settings easily

---

## 🚀 Quick Start

### 1️⃣ Generate Session

```bash
npm install
npm run session
```

Then open `http://localhost:3000` and choose:
- **📱 QR Code**: Scan with WhatsApp
- **☎️ Phone Number**: Use pairing code method

### 2️⃣ Deploy to Railway

Click the button above or:
- Set `SESSION_ID` environment variable
- Deploy automatically

### 3️⃣ Use Your Bot

Send commands in WhatsApp:
```
.menu    - Show all commands
.ping    - Check speed
.alive   - Bot status
.help    - Get help
```

---

## 📥 Installation

### Prerequisites
- Node.js 14+ or Railway account
- WhatsApp account

### Local Setup

```bash
# Clone repository
git clone https://github.com/simontech-maxb/SIMON-TECH-Bot2.git
cd SIMON-TECH-Bot2

# Install dependencies
npm install

# Generate session
npm run session

# Create .env file
cp .env.example .env

# Edit .env with your SESSION_ID

# Start bot
npm start
```

### Development Mode

```bash
npm run dev    # Auto-reload on file changes
```

---

## 🎯 Available Commands

| Command | Description |
|---------|-------------|
| `.menu` | Show all available commands |
| `.ping` | Check bot response time |
| `.alive` | Show bot status & uptime |
| `.help` | Display help information |
| `.uptime` | Show how long bot is running |
| `.owner` | Get owner information |

---

## 🛠️ Configuration

Edit `.env` file:

```env
# Session
SESSION_ID=your_generated_session_id

# Bot Settings
BOT_NAME=SIMON
BOT_PREFIX=.
BOT_VERSION=2.0.0

# Owner Info
OWNER_NUMBER=2349166265317
OWNER_NAME=SIMON TECH

# Features
ENABLE_AUTO_REPLY=true

# Server
PORT=3000
NODE_ENV=production
```

---

## 🚂 Deploy to Railway

### Option 1: One-Click Deploy (Easiest)

Click the Railway button at the top ☝️

### Option 2: Manual Deployment

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add environment variables
5. Deploy automatically

### Option 3: Using Railway CLI

```bash
npm install -g railway
railway login
railway link
railway up
```

---

## 📱 Session Generator Methods

### Method 1: QR Code (Recommended)

1. Run `npm run session`
2. Open browser to `http://localhost:3000`
3. Click **"Generate QR Code"**
4. Scan with WhatsApp camera/app
5. Copy SESSION_ID

### Method 2: Phone Number Pairing

1. Run `npm run session`
2. Go to **"Phone Number"** tab
3. Enter your number with country code
4. Enter 8-digit pairing code from WhatsApp
5. Copy SESSION_ID

---

## 📊 Project Structure

```
SIMON-TECH-Bot2/
├── index.js                 # Main bot file
├── session-generator-v2.js  # Session generator (QR + Phone)
├── menu.js                  # Menu commands
├── config.js                # Configuration
├── package.json             # Dependencies
├── .env.example             # Environment template
├── railway.json             # Railway config
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

---

## 🔐 Security Tips

- ✅ Keep `SESSION_ID` secret
- ✅ Never share `.env` file
- ✅ Use strong owner number
- ✅ Enable security features in `.env`
- ✅ Regenerate session if compromised

---

## 📈 Monitoring

### Check Bot Status

```bash
.alive   # Shows uptime & stats
.ping    # Measures response time
.uptime  # Uptime duration
```

### Railway Dashboard

- View real-time logs
- Monitor CPU/Memory
- Check deployment status
- Restart bot if needed

---

## 🐛 Troubleshooting

### Bot Not Connecting

- Verify SESSION_ID is correct
- Check internet connection
- Regenerate session if expired
- Check logs: `Railway Dashboard → Logs`

### Session Expired

```bash
npm run session
# Generate new SESSION_ID and update .env or Railway variables
```

### Permission Denied

```bash
# Linux/Mac
chmod +x *.js
npm start

# Or use Node directly
node index.js
```

---

## 📝 Common Issues

| Issue | Solution |
|-------|----------|
| QR Code not displaying | Refresh browser, check port 3000 |
| Session generation fails | Ensure WhatsApp is updated |
| Bot offline on Railway | Check environment variables |
| Commands not working | Verify prefix (default: `.`) |

---

## 🎓 Learning Resources

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Railway Documentation](https://docs.railway.app)
- [Node.js Guide](https://nodejs.org/docs)

---

## 📞 Support & Contributions

- **Report Bug**: [GitHub Issues](https://github.com/simontech-maxb/SIMON-TECH-Bot2/issues)
- **Suggest Feature**: Open an issue with `[FEATURE]` prefix
- **Contribute**: Fork and send pull requests

---

## 📜 License

MIT License - feel free to use and modify

---

## ⭐ If You Like This Project

- Give it a **star** ⭐
- **Share** with others
- **Follow** for updates
- **Contribute** improvements

---

## 🙏 Credits

- Built with [Baileys](https://github.com/WhiskeySockets/Baileys)
- Hosted on [Railway](https://railway.app)
- Deployed with ❤️ by SIMON TECH

---

**Made with 💻 and ☕ by SIMON TECH**

🚀 Happy Botting! 🤖

# 🚀 SIMON-TECH-BOT Deployment Guide

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fsimontech-maxb%2FSIMON-TECH-Bot2&envs=SESSION_ID%2CBOT_NAME%2CBOT_PREFIX%2COWNER_NUMBER&optionalEnvs=SESSION_ID&SESSION_IDDescription=Your%20WhatsApp%20Session%20ID%20%28Generate%20from%20session%20generator%29&BOT_NAMEDefault=SIMON&BOT_PREFIXDefault=.&OWNER_NUMBERDefault=2349166265317)

---

## 📋 Prerequisites

- Node.js 14+ (or use Railway which handles this)
- WhatsApp account
- GitHub account (for Railway deployment)

---

## 🎯 Step 1: Generate Session ID

### Option A: QR Code Method (Recommended)

```bash
npm run session
```

Then:
1. Open `http://localhost:3000` in your browser
2. Click **"Generate QR Code"**
3. Scan with WhatsApp on your phone
4. Copy the generated **SESSION_ID**
5. Save it securely

### Option B: Phone Number Method

```bash
npm run session
```

Then:
1. Switch to **"Phone Number"** tab
2. Enter your WhatsApp phone number (with country code, e.g., +1234567890)
3. Click **"Request Pairing Code"**
4. Enter the 8-digit code in WhatsApp linking
5. Copy the generated **SESSION_ID**

---

## 🚂 Step 2: Deploy to Railway

### Method 1: One-Click Deploy (Easiest)

1. Click the **Deploy on Railway** button above
2. Sign in with your GitHub account
3. Fill in the environment variables:
   - **SESSION_ID**: Your generated SESSION_ID
   - **BOT_NAME**: SIMON (or your preferred name)
   - **BOT_PREFIX**: . (or your preferred prefix)
   - **OWNER_NUMBER**: Your WhatsApp number
4. Click **Deploy**
5. Railway will automatically start your bot! 🎉

### Method 2: Manual Railway Deployment

1. **Fork/Clone this repository**
   ```bash
   git clone https://github.com/simontech-maxb/SIMON-TECH-Bot2.git
   cd SIMON-TECH-Bot2
   ```

2. **Create Railway Project**
   - Go to [Railway.app](https://railway.app)
   - Click **New Project**
   - Select **Deploy from GitHub**
   - Connect your GitHub account
   - Select this repository

3. **Add Environment Variables**
   - Go to your Railway project
   - Click **Variables**
   - Add the following:
     ```
     SESSION_ID=<your_generated_session_id>
     BOT_NAME=SIMON
     BOT_PREFIX=.
     OWNER_NUMBER=<your_phone_number>
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway automatically deploys on every push to `main`
   - Check the deployment logs for status

---

## 🏠 Step 3: Local Development (Optional)

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Edit `.env`

```env
SESSION_ID=your_generated_session_id_here
BOT_NAME=SIMON
BOT_PREFIX=.
BOT_VERSION=2.0.0
OWNER_NUMBER=2349166265317
OWNER_NAME=SIMON TECH
ENABLE_AUTO_REPLY=true
NODE_ENV=development
PORT=3000
```

### Run Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## 📱 Step 4: Test Your Bot

Once deployed, test commands in WhatsApp:

```
.menu       - Show all commands
.ping       - Check bot speed
.alive      - Bot status
.help       - Show help
.uptime     - Bot uptime
.owner      - Owner information
```

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_ID` | ✅ Yes | - | Your WhatsApp session (base64 encoded) |
| `BOT_NAME` | ❌ No | SIMON | Bot display name |
| `BOT_PREFIX` | ❌ No | . | Command prefix |
| `BOT_VERSION` | ❌ No | 2.0.0 | Bot version |
| `OWNER_NUMBER` | ❌ No | 2349166265317 | Owner's WhatsApp number |
| `OWNER_NAME` | ❌ No | SIMON TECH | Owner's name |
| `ENABLE_AUTO_REPLY` | ❌ No | true | Enable auto replies |
| `NODE_ENV` | ❌ No | development | Environment (development/production) |
| `PORT` | ❌ No | 3000 | Server port |

---

## 🛠️ Railway Project Setup

### Health Check

Railway will automatically check if your bot is running:
- Endpoint: `POST /check-session`
- Timeout: 30 seconds

### Logs

View real-time logs in Railway:
1. Go to Railway Dashboard
2. Select your project
3. Click **Logs** tab
4. Monitor bot activity

---

## 🔄 Restart Bot

### On Railway Dashboard

1. Go to your project
2. Click **Deployments**
3. Find the latest deployment
4. Click **Restart** button

### Via Git Push

Simply push to `main` branch:

```bash
git add .
git commit -m "Update bot"
git push origin main
```

Railway auto-deploys on push!

---

## 📊 Monitoring

### Railway Metrics

- **CPU Usage**: Check bot performance
- **Memory**: Monitor resource usage
- **Network**: View data transfer
- **Logs**: Debug any issues

### Bot Commands for Status

```
.ping    - See bot response time
.alive   - Full bot status
.uptime  - How long bot has been running
```

---

## ⚠️ Troubleshooting

### Bot Not Responding

1. Check SESSION_ID is correct
2. Verify bot is deployed on Railway
3. Check logs for errors:
   ```bash
   Railway Dashboard → Logs tab
   ```

### Session Expired

Generate a new SESSION_ID and update:
1. Stop current deployment
2. Run `npm run session` locally
3. Update `SESSION_ID` in Railway variables
4. Redeploy

### Connection Issues

- Ensure SESSION_ID is base64 encoded
- Check internet connection
- Verify WhatsApp account is not logged in elsewhere
- Try phone number pairing method

---

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/simontech-maxb/SIMON-TECH-Bot2/issues)
- Documentation: Check README.md
- Session Generator: Run `npm run session`

---

## 🎓 Next Steps

1. ✅ Generate SESSION_ID
2. ✅ Deploy to Railway
3. ✅ Test commands in WhatsApp
4. 📝 Customize bot settings
5. 🚀 Add custom commands

Happy botting! 🤖✨

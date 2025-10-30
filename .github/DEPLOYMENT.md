# GitHub Actions Deployment Setup

This guide explains how to configure GitHub Actions for automatic deployment to your production server.

## 🔐 Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. SSH_PRIVATE_KEY

The private SSH key for connecting to your server.

**To add this secret:**

1. On your local machine, get the content of your SSH key:
   ```bash
   cat ~/Downloads/kcs-dev.pem
   ```

2. Copy the entire content (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

3. Go to your GitHub repository
4. Navigate to **Settings** → **Secrets and variables** → **Actions**
5. Click **New repository secret**
6. Name: `SSH_PRIVATE_KEY`
7. Value: Paste the private key content
8. Click **Add secret**

## 📋 Deployment Workflow

The workflow automatically runs when:
- You push to the `main` branch
- You manually trigger it from the Actions tab

### Deployment Steps:

1. ✅ Checkout code
2. 📥 Connect to server via SSH
3. 📦 Pull latest code from GitHub
4. 🔧 Install dependencies (`npm install`)
5. 🔨 Build application (`npm run build`)
6. 🔄 Restart PM2 processes
6. 💾 Save PM2 configuration
7. ⚙️ Configure PM2 startup
8. 🔍 Verify deployment status

## 🚀 Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

## 🖥️ Server Requirements

Make sure your server has:

- ✅ Node.js installed
- ✅ npm installed
- ✅ PM2 installed globally (`npm install -g pm2`)
- ✅ Git configured with access to the repository
- ✅ Project cloned at `/home/ubuntu/dm-automations`

## 📁 Server Setup Commands

Run these once on your server:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Clone repository (if not already done)
cd ~
git clone https://github.com/omyratechnologies/dm-automation.git dm-automations
cd dm-automations

# Configure PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## 🔧 Ecosystem Configuration

Make sure you have `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [{
    name: 'gemai',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/dm-automations',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## 📊 Monitoring

After deployment, you can:

- View deployment logs in GitHub Actions
- Check server status: `pm2 status`
- View logs: `pm2 logs`
- Monitor: `pm2 monit`

## 🐛 Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. SSH into server and check manually:
   ```bash
   ssh -i ~/Downloads/kcs-dev.pem ubuntu@65.0.94.178
   cd dm-automations
   pm2 logs
   ```

### PM2 Not Starting

```bash
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### Build Fails

```bash
npm install
npm run build
```

## 🔒 Security Notes

- Never commit your SSH private key to the repository
- Keep secrets in GitHub Secrets only
- Regularly rotate SSH keys
- Use least-privilege access for deployment user

## 📞 Support

If you encounter issues, check:
- GitHub Actions logs
- Server logs: `pm2 logs`
- Server status: `pm2 status`

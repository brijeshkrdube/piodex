# PioSwap VPS Deployment Guide (Ubuntu)

## Prerequisites
- Ubuntu 20.04+ VPS with root access
- Domain name (e.g., pioswap.yourdomain.com)
- At least 2GB RAM, 20GB storage

---

## Step 1: Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install Yarn
npm install -g yarn

# Install PM2 (Process Manager)
npm install -g pm2
```

---

## Step 2: Create Application User

```bash
# Create user for the app
sudo useradd -m -s /bin/bash pioswap
sudo usermod -aG sudo pioswap

# Switch to app user
sudo su - pioswap
```

---

## Step 3: Clone/Upload Your Code

```bash
# Create app directory
mkdir -p /home/pioswap/app
cd /home/pioswap/app

# Option A: Clone from GitHub (if you pushed the code)
git clone https://github.com/yourusername/pioswap.git .

# Option B: Upload files via SCP from your local machine
# Run this on YOUR LOCAL machine:
# scp -r /path/to/pioswap/* pioswap@your-vps-ip:/home/pioswap/app/
```

---

## Step 4: Setup Backend

```bash
cd /home/pioswap/app/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=pioswap
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF

# Test backend
python -c "from database import db; print('DB connection OK')"
```

---

## Step 5: Setup Frontend

```bash
cd /home/pioswap/app/frontend

# Install dependencies
yarn install

# Create .env file (replace with your domain)
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# Build production version
yarn build
```

---

## Step 6: Create PM2 Process Files

```bash
# Create PM2 ecosystem file
cat > /home/pioswap/app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'pioswap-backend',
      cwd: '/home/pioswap/app/backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      env: {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'pioswap'
      }
    }
  ]
};
EOF
```

---

## Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/pioswap
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /home/pioswap/app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/pioswap /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 8: Setup SSL (HTTPS) with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

---

## Step 9: Start the Application

```bash
# Start backend with PM2
cd /home/pioswap/app
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u pioswap --hp /home/pioswap
# Run the command it outputs
```

---

## Step 10: Initialize Database with Tokens

```bash
cd /home/pioswap/app/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from database import db

async def init_tokens():
    # Clear existing tokens
    await db.tokens.delete_many({})
    
    # Add real tokens
    tokens = [
        {
            "id": "pio",
            "symbol": "PIO",
            "name": "PIOGOLD",
            "address": "0x0000000000000000000000000000000000000000",
            "decimals": 18,
            "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=pio&backgroundColor=FFD700",
            "price": 2.45,
            "price_change_24h": 0,
            "is_native": True
        },
        {
            "id": "wpio",
            "symbol": "WPIO",
            "name": "Wrapped PIO",
            "address": "0x9da12b8cf8b94f2e0eedd9841e268631af03adb1",
            "decimals": 18,
            "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=wpio&backgroundColor=DAA520",
            "price": 2.45,
            "price_change_24h": 0,
            "is_native": False
        },
        {
            "id": "usdt",
            "symbol": "USDT",
            "name": "Tether USD",
            "address": "0x75c681d7d00b6cda3778535bba87e433ca369c96",
            "decimals": 18,
            "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=usdt&backgroundColor=26A17B",
            "price": 1.00,
            "price_change_24h": 0,
            "is_native": False
        }
    ]
    
    await db.tokens.insert_many(tokens)
    
    # Initialize stats
    await db.stats.delete_many({})
    await db.stats.insert_one({
        "total_volume": 0,
        "tvl": 0,
        "total_swappers": 0,
        "volume_24h": 0,
        "transactions_24h": 0,
        "active_pools": 0
    })
    
    print("✅ Database initialized with tokens!")

asyncio.run(init_tokens())
EOF
```

---

## Useful Commands

```bash
# View backend logs
pm2 logs pioswap-backend

# Restart backend
pm2 restart pioswap-backend

# Check status
pm2 status

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# MongoDB status
sudo systemctl status mongod
```

---

## Firewall Setup

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Adding New Tokens

To add a new token, run this in the backend directory:

```bash
cd /home/pioswap/app/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from database import db

async def add_token():
    token = {
        "id": "usdc",
        "symbol": "USDC",
        "name": "USD Coin",
        "address": "0xYOUR_USDC_CONTRACT_ADDRESS".lower(),
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=usdc&backgroundColor=2775CA",
        "price": 1.00,
        "price_change_24h": 0,
        "is_native": False
    }
    await db.tokens.insert_one(token)
    print("✅ Token added!")

asyncio.run(add_token())
EOF
```

---

## Contract Addresses (Already Configured)

| Contract | Address |
|----------|---------|
| WPIO | `0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1` |
| Factory | `0x3EE7ad0FD1C17A4d62a1a214d88dcf2C04ae43E5` |
| Router | `0xE2E593258a0012Af79221C518Fa058eB4fF3700A` |
| USDT | `0x75C681D7d00b6cDa3778535Bba87E433cA369C96` |

---

## Troubleshooting

### Backend not starting
```bash
cd /home/pioswap/app/backend
source venv/bin/activate
python server.py  # Check for errors
```

### MongoDB connection issues
```bash
sudo systemctl status mongod
sudo journalctl -u mongod
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status
pm2 logs pioswap-backend

# Check Nginx config
sudo nginx -t
```

### SSL Certificate Issues
```bash
sudo certbot renew --dry-run
```

---

## Support

Your PioSwap DEX is now ready for production!

- Frontend: https://yourdomain.com
- API: https://yourdomain.com/api
- Explorer: https://pioscan.com

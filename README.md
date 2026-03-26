# Apollo Lead Finder

Apollo Lead Finder is a single-user web app for turning Apollo company searches into people searches and verified-email exports without wasting Apollo credits.

## Stack

- Next.js 15
- React 19
- TypeScript
- Server-side Apollo API access
- File-backed storage today, with optional `DATABASE_URL` support

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Fill in the required values:

```bash
APOLLO_API_KEY=your_apollo_api_key_here
DATABASE_URL=
RECIPE_DATA_FILE=
```

4. Start the dev server:

```bash
npm run dev
```

## Ubuntu EC2 Deployment

This is the cheapest practical AWS deployment for the current app shape:

`Internet -> Nginx on EC2 (HTTPS) -> Next.js on localhost:3000`

Why this path:

- avoids the monthly cost of an Application Load Balancer
- works well with the app's current file-backed storage behavior
- keeps Apollo credentials on the server

### 1. Launch the EC2 instance

Recommended baseline:

- Ubuntu 24.04 LTS
- `t3.micro`
- 20 GB `gp3`
- Public IPv4 enabled

### 2. Allocate and attach an Elastic IP

In the AWS EC2 console:

1. Go to `Network & Security` -> `Elastic IPs`
2. Click `Allocate Elastic IP address`
3. Create it from Amazon's public IPv4 pool
4. Select the new Elastic IP
5. Click `Actions` -> `Associate Elastic IP address`
6. Attach it to your EC2 instance

Use this Elastic IP in DNS instead of the instance's temporary public IP.

### 3. Configure the EC2 security group

Allow:

- `22` from your IP only
- `80` from anywhere
- `443` from anywhere

Do not expose port `3000`.

### 4. Point your domain to the server

At Namecheap, create an `A` record:

- `Type`: `A Record`
- `Host`: `app`
- `Value`: `YOUR_ELASTIC_IP`
- `TTL`: `Automatic`

That will point `app.yourdomain.com` to the EC2 instance.

If you want the root domain instead, use:

- `Type`: `A Record`
- `Host`: `@`
- `Value`: `YOUR_ELASTIC_IP`

### 5. Install system packages

SSH into the instance and run:

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 6. Download the app and install dependencies

```bash
cd /home/ubuntu
git clone YOUR_REPO_URL apollo
cd /home/ubuntu/apollo
npm ci
```

### 7. Create the production environment file

Create `/home/ubuntu/apollo/.env.production`:

```dotenv
NODE_ENV=production
APOLLO_API_KEY=your_apollo_api_key_here
DATABASE_URL=
RECIPE_DATA_FILE=data/recipes.json
```

Notes:

- `APOLLO_API_KEY` is required
- `RECIPE_DATA_FILE=data/recipes.json` keeps the current file-backed storage inside the app directory
- `DATABASE_URL` can stay empty unless you are using a Postgres-backed path

### 8. Prepare the data directory

The current app persists JSON data on disk, so make sure the directory exists and is writable:

```bash
mkdir -p /home/ubuntu/apollo/data
sudo chown -R ubuntu:ubuntu /home/ubuntu/apollo
```

### 9. Build the app

```bash
cd /home/ubuntu/apollo
npm run build
```

Optional quick smoke test:

```bash
npm run start
```

If that works, stop it with `Ctrl+C` and continue with `systemd`.

### 10. Run the app with systemd

Create `/etc/systemd/system/apollo.service`:

```ini
[Unit]
Description=Apollo Lead Finder
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apollo
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/apollo/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable apollo
sudo systemctl start apollo
sudo systemctl status apollo
```

### 11. Configure Nginx

Create `/etc/nginx/sites-available/apollo`:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/apollo /etc/nginx/sites-enabled/apollo
sudo nginx -t
sudo systemctl reload nginx
```

### 12. Install the TLS certificate with Let's Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request the certificate:

```bash
sudo certbot --nginx -d app.yourdomain.com
```

Choose the redirect-to-HTTPS option when prompted.

Verify renewal:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Updating the Server

For a simple manual deploy:

```bash
cd /home/ubuntu/apollo
git pull
npm ci
npm run build
sudo systemctl restart apollo
```

## Operations Notes

- This app currently writes JSON data to disk, so an EC2 VM is a better fit than stateless serverless hosting.
- Keep the same instance and volume if you want to preserve local data.
- If you later move fully to Postgres, deployment options widen considerably.
- If DNS or TLS fails, check that the `A` record already points to the Elastic IP before running `certbot`.

## Useful Commands

Check app service logs:

```bash
sudo journalctl -u apollo -n 200 --no-pager
```

Restart the app:

```bash
sudo systemctl restart apollo
```

Check Nginx status:

```bash
sudo systemctl status nginx
```

Test Nginx config:

```bash
sudo nginx -t
```

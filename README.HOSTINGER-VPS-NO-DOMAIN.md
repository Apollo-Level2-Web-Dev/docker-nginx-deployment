# Hostinger VPS Deployment (No Domain) - CI/CD First

## Files Added

- [docker-compose.prod.yaml](docker-compose.prod.yaml)
- [nginx/ph-healthcare.conf](nginx/ph-healthcare.conf)
- [.github/workflows/cicd.yml](.github/workflows/cicd.yml)
- [server/Dockerfile.prod](server/Dockerfile.prod)
- [client/Dockerfile.prod](client/Dockerfile.prod)

## 1) One-Time VPS Setup

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y git nginx ufw ca-certificates curl
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker nginx
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2) Clone Project on VPS

```bash
mkdir -p /opt/apps
cd /opt/apps
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ph-healthcare
cd ph-healthcare
```

## 3) Install Nginx Reverse Proxy

```bash
cp nginx/ph-healthcare.conf /etc/nginx/sites-available/ph-healthcare
ln -sf /etc/nginx/sites-available/ph-healthcare /etc/nginx/sites-enabled/ph-healthcare
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Nginx routes:
- `/` -> frontend container (`127.0.0.1:3000`)
- `/api/v1` -> backend container (`127.0.0.1:5000`)
- `/api/auth` -> backend container (`127.0.0.1:5000`)
- `/webhook` -> backend container (`127.0.0.1:5000`)

## 4) GitHub Secrets Required

Add these in GitHub repository secrets:

- `VPS_HOST` = VPS public IP
- `VPS_USER` = SSH user
- `VPS_SSH_KEY` = private SSH key
- `VPS_APP_DIR` = `/opt/apps/ph-healthcare`
- `POSTGRES_PASSWORD` = DB password
- `CLIENT_PUBLIC_API_BASE_URL` = `http://YOUR_VPS_IP/api/v1`
- `SERVER_ENV_PRODUCTION` = full content of `server/.env.production`
- `GHCR_USERNAME` = GitHub username (required if GHCR packages are private)
- `GHCR_TOKEN` = GitHub PAT with `read:packages` (required if GHCR packages are private)

Example `SERVER_ENV_PRODUCTION` value:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@ph-db:5432/ph_health?schema=public
BETTER_AUTH_SECRET=YOUR_SECRET
BETTER_AUTH_URL=http://YOUR_VPS_IP
ACCESS_TOKEN_SECRET=YOUR_ACCESS_SECRET
REFRESH_TOKEN_SECRET=YOUR_REFRESH_SECRET
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d
EMAIL_SENDER_SMTP_USER=...
EMAIL_SENDER_SMTP_PASS=...
EMAIL_SENDER_SMTP_HOST=...
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://YOUR_VPS_IP/api/v1/auth/google/success
FRONTEND_URL=http://YOUR_VPS_IP
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_PASSWORD=...
```

## 5) First Deploy from CI/CD

Push to `main`.

Pipeline in [.github/workflows/cicd.yml](.github/workflows/cicd.yml):
1. Lint and build server/client
2. Build and push Docker images to GHCR
3. SSH to VPS and deploy with [docker-compose.prod.yaml](docker-compose.prod.yaml)
4. Run Prisma migrate deploy

## 6) Verify on VPS

```bash
cd /opt/apps/ph-healthcare
docker ps
docker compose --env-file .env.stack -f docker-compose.prod.yaml logs --tail=100 ph-server
docker compose --env-file .env.stack -f docker-compose.prod.yaml logs --tail=100 ph-client
curl -I http://YOUR_VPS_IP
```

## 7) Update Flow

Every push to `main` triggers deploy automatically.

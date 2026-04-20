# PH Healthcare Production Deployment (VPS + GitHub Actions CI/CD)

This is a full start-to-end deployment runbook for this project.

Use this guide to reproduce production deployment on a VPS with:
- Docker Compose
- Nginx reverse proxy
- GitHub Actions CI/CD
- Docker Hub image registry

This guide includes:
- exact file contents used by deployment
- where each environment variable must be set
- CI helper script usage
- process diagrams for each GitHub Actions stage
- verification and troubleshooting commands

---


## 2) Deployment Files (Exact Code)

### 2.1 .github/workflows/cicd.yml

```yaml
name: CI-CD

on:
  pull_request:
    branches: ["main"]
  push:
    branches: ["main"]

permissions:
  contents: read

env:
  REGISTRY: docker.io

concurrency:
  group: deploy-main
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.20.0

      - name: Install server deps
        working-directory: ./server
        run: pnpm install --frozen-lockfile

      - name: Lint server
        working-directory: ./server
        run: pnpm lint

      - name: Generate Prisma client
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres?schema=public
        run: pnpm generate

      - name: Build server
        working-directory: ./server
        run: pnpm build

      - name: Install client deps
        working-directory: ./client
        run: pnpm install --frozen-lockfile

      - name: Lint client
        working-directory: ./client
        run: pnpm lint

      - name: Build client
        working-directory: ./client
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.CLIENT_PUBLIC_API_BASE_URL }}
        run: pnpm exec next build

  docker:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Normalize image namespace
        id: vars
        shell: bash
        run: |
          echo "namespace=${{ secrets.DOCKERHUB_USERNAME }}" >> "$GITHUB_OUTPUT"

      - name: Setup Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push server image
        uses: docker/build-push-action@v6
        with:
          context: ./server
          file: ./server/Dockerfile.prod
          push: true
          tags: |
            docker.io/${{ steps.vars.outputs.namespace }}/ph-healthcare-server:latest
            docker.io/${{ steps.vars.outputs.namespace }}/ph-healthcare-server:${{ github.sha }}

      - name: Build and push client image
        uses: docker/build-push-action@v6
        with:
          context: ./client
          file: ./client/Dockerfile.prod
          build-args: |
            NEXT_PUBLIC_API_BASE_URL=${{ secrets.CLIENT_PUBLIC_API_BASE_URL }}
          push: true
          tags: |
            docker.io/${{ steps.vars.outputs.namespace }}/ph-healthcare-client:latest
            docker.io/${{ steps.vars.outputs.namespace }}/ph-healthcare-client:${{ github.sha }}

  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: docker
    environment: production

    steps:
      - name: Normalize image namespace
        id: vars
        shell: bash
        run: |
          echo "namespace=${{ secrets.DOCKERHUB_USERNAME }}" >> "$GITHUB_OUTPUT"

      - name: Deploy on VPS
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            APP_DIR="${{ secrets.VPS_APP_DIR }}"

            if [ -z "$APP_DIR" ]; then
              echo "VPS_APP_DIR secret is empty. Set it to the repo path on the VPS, for example /opt/apps/ph-healthcare."
              exit 1
            fi

            if [ ! -d "$APP_DIR" ]; then
              echo "VPS_APP_DIR does not exist on the VPS: $APP_DIR"
              echo "Create it and clone the repo there, for example:"
              echo "  mkdir -p /opt/apps && cd /opt/apps && git clone <repo-url> ph-healthcare"
              exit 1
            fi

            cd "$APP_DIR"

            if [ -d .git ]; then
              git fetch --all --prune
              git checkout main
              git reset --hard ${{ github.sha }}
            fi

            printf '%s' "${{ secrets.SERVER_ENV_PRODUCTION }}" > server/.env.production

            export REGISTRY=docker.io
            export IMAGE_NAMESPACE=${{ steps.vars.outputs.namespace }}
            export IMAGE_TAG=${{ github.sha }}
            export POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
            export ACCESS_TOKEN_SECRET=${{ secrets.ACCESS_TOKEN_SECRET }}
            export JWT_ACCESS_SECRET=${{ secrets.ACCESS_TOKEN_SECRET }}

            echo "${{ secrets.DOCKERHUB_TOKEN }}" | docker login docker.io -u "${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin

            docker compose -f docker-compose.prod.yaml pull
            docker compose -f docker-compose.prod.yaml up -d
            docker compose -f docker-compose.prod.yaml run --rm ph-server sh -lc "pnpm dlx prisma@7.3.0 migrate deploy --schema=prisma/schema"
            docker image prune -f
```

### 2.2 docker-compose.prod.yaml

```yaml
services:
  ph-db:
    image: postgres:16-alpine
    container_name: ph-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ph_health
    volumes:
      - ph-pg-data:/var/lib/postgresql/data
    networks:
      - ph-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ph_health"]
      interval: 10s
      timeout: 5s
      retries: 10

  ph-server:
    image: ${REGISTRY}/${IMAGE_NAMESPACE}/ph-healthcare-server:${IMAGE_TAG}
    container_name: ph-server
    restart: unless-stopped
    env_file:
      - ./server/.env.production
    depends_on:
      ph-db:
        condition: service_healthy
    networks:
      - ph-net
    ports:
      - "127.0.0.1:5000:5000"

  ph-client:
    image: ${REGISTRY}/${IMAGE_NAMESPACE}/ph-healthcare-client:${IMAGE_TAG}
    container_name: ph-client
    restart: unless-stopped
    environment:
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
    depends_on:
      - ph-server
    networks:
      - ph-net
    ports:
      - "127.0.0.1:3000:3000"

networks:
  ph-net:
    driver: bridge

volumes:
  ph-pg-data:
```

### 2.3 nginx/ph-healthcare.conf

```nginx
server {
    listen 80;
    server_name 178.16.138.32;

    client_max_body_size 25m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/auth/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

### 2.4 server/Dockerfile.prod

```dockerfile
FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .
RUN pnpm generate && pnpm build
RUN pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production

RUN npm install -g tsx@4.21.0

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["tsx", "dist/src/server.js"]
```

### 2.5 client/Dockerfile.prod

docker build -f client/Dockerfile -t ph-client:single-stage client

docker build -f client/Dockerfile.prod -t ph-client:multi-stage --build-arg NEXT_PUBLIC_API_BASE_URL=http://example.com/api/v1 client

```dockerfile
FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app

COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN pnpm exec next build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

Do not commit real values.
Use this local-only template:


## 3) Environment Variables: Where to Set What

### 3.1 GitHub Repository Secrets

Set these in GitHub repository settings -> Secrets and variables -> Actions:

- ACCESS_TOKEN_SECRET
- POSTGRES_PASSWORD
- SERVER_ENV_PRODUCTION
- VPS_SSH_KEY
- DOCKERHUB_USERNAME=bayajidph
- DOCKERHUB_TOKEN=YOUR_DOCKERHUB_ACCESS_TOKEN
- VPS_HOST=178.16.138.32
- VPS_USER=root
- VPS_APP_DIR=/opt/apps/docker-nginx-deployment
- CLIENT_PUBLIC_API_BASE_URL=http://178.16.138.32/api/v1
- ACCESS_TOKEN_SECRET=accesssecret
- JWT_ACCESS_SECRET=accesssecret

### 3.2 server/.env.production (local file, then uploaded into GitHub secret)

Create this file locally in server/.env.production and put full backend production env:

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

### 3.3 Runtime env files on VPS

These are written/exported by workflow automatically:

- server/.env.production written from SERVER_ENV_PRODUCTION secret.
- Shell exports for deploy: REGISTRY, IMAGE_NAMESPACE, IMAGE_TAG, POSTGRES_PASSWORD, ACCESS_TOKEN_SECRET, JWT_ACCESS_SECRET.

## 5) One-Time VPS Setup

SSH into VPS and run:

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

Clone project:

```bash
mkdir -p /opt/apps
cd /opt/apps
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ph-healthcare
cd ph-healthcare
```

Install Nginx site:

```bash
cp nginx/ph-healthcare.conf /etc/nginx/sites-available/ph-healthcare
ln -sf /etc/nginx/sites-available/ph-healthcare /etc/nginx/sites-enabled/ph-healthcare
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 6) Upload GitHub Secrets (Recommended via Script)

### Option A: Automatic upload using scripts/set-github-secrets.ps1

On your local machine:

1) Prepare server/.env.production with real values.
2) Prepare ci/github-secrets.input.env with values.
3) Authenticate GitHub CLI:

```powershell
gh auth login
```

4) Upload all required secrets:

```powershell
./scripts/set-github-secrets.ps1 -Repo "YOUR_ORG_OR_USER/YOUR_REPO"
```

### Option B: Manual upload in GitHub UI

Set every secret listed in section 3.1 manually.

---

## 7) First Deployment

Push to main branch:

```bash
git add .
git commit -m "setup production deployment"
git push origin main
```

Then monitor GitHub Actions pipeline.

Success condition:
- quality passed
- docker passed
- deploy passed

---

## 8) Manual VPS Shell Prep (No .env.stack)

When running docker compose manually on VPS, export the compose variables once per shell session:

```bash
export REGISTRY=docker.io
export IMAGE_NAMESPACE=YOUR_DOCKERHUB_USERNAME
export IMAGE_TAG=YOUR_DEPLOYED_IMAGE_TAG
export POSTGRES_PASSWORD=YOUR_DB_PASSWORD
export ACCESS_TOKEN_SECRET=YOUR_ACCESS_SECRET
export JWT_ACCESS_SECRET=$ACCESS_TOKEN_SECRET
```

Then run compose commands normally.

---

## 9) Verify Deployment on VPS

```bash
cd /opt/apps/ph-healthcare
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs --tail=200 ph-server
docker compose -f docker-compose.prod.yaml logs --tail=200 ph-client
curl -I http://YOUR_VPS_IP
```

Open UI:

http://YOUR_VPS_IP

---

## 10) Day-2 Operations

Check status:

```bash
cd /opt/apps/ph-healthcare
docker compose -f docker-compose.prod.yaml ps
docker ps
```

Restart services:

```bash
docker compose -f docker-compose.prod.yaml restart ph-server
docker compose -f docker-compose.prod.yaml restart ph-client
docker compose -f docker-compose.prod.yaml restart
```

Run migration manually:

```bash
docker compose -f docker-compose.prod.yaml run --rm ph-server sh -lc "pnpm dlx prisma@7.3.0 migrate deploy --schema=prisma/schema"
```

Nginx checks:

```bash
nginx -t
systemctl reload nginx
systemctl status nginx --no-pager
```

---

## 11) Troubleshooting

### 11.1 Docker Hub push fails with 401 insufficient scopes

Fix:
1. Create new Docker Hub token with Read/Write.
2. Update DOCKERHUB_TOKEN in GitHub secrets.
3. Re-run failed job.

### 11.2 Prisma schema not found in deploy job

Expected fixed configuration in this repo:
- workflow migrate command uses --schema=prisma/schema
- server image includes prisma folder and prisma.config.ts
- prisma.config.ts schema path is prisma/schema

Debug command:

```bash
cd /opt/apps/ph-healthcare
docker compose -f docker-compose.prod.yaml run --rm ph-server sh -lc "ls -la prisma && ls -la prisma/schema"
```

### 11.3 UI not opening

Check Nginx + upstream:

```bash
nginx -t
systemctl status nginx --no-pager
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:5000
ufw status
```

---

## 12) Security Notes

- Do not commit ci/github-secrets.input.env with real values.
- Rotate any token immediately if exposed.
- Keep VPS_SSH_KEY only in GitHub secrets.
- Prefer Docker Hub access tokens over account password.
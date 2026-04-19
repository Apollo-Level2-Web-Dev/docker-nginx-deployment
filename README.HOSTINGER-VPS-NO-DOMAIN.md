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

## 1) Architecture Overview

```mermaid
flowchart TB
  classDef actor fill:#e8f0fe,stroke:#2f5bea,color:#0b1f66;
  classDef ci fill:#f5f3ff,stroke:#6b46c1,color:#2d1b69;
  classDef infra fill:#ecfdf3,stroke:#047857,color:#064e3b;
  classDef data fill:#fff7ed,stroke:#c2410c,color:#7c2d12;

  DEV[Developer push to main]:::actor --> QA

  subgraph GHA[GitHub Actions Pipeline]
    direction TB
    QA[quality job\nlint + build]:::ci --> DK[docker job\nbuild and push images]:::ci --> DP[deploy job\nssh and deploy]:::ci
  end

  DK --> DH[(Docker Hub\nserver/client images)]:::data
  DP --> VPS[VPS host]:::infra

  subgraph VPSSTACK[VPS Runtime Stack]
    direction TB
    NGINX[Nginx :80]:::infra
    COMPOSE[docker compose prod]:::infra
    DB[(Postgres)]:::data
    API[ph-server\n127.0.0.1:5000]:::infra
    WEB[ph-client\n127.0.0.1:3000]:::infra
  end

  VPS --> COMPOSE
  DH --> COMPOSE
  COMPOSE --> DB
  COMPOSE --> API
  COMPOSE --> WEB

  USER[Browser user]:::actor --> NGINX
  NGINX --> WEB
  NGINX --> API
```

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

            printf '%s' "${{ secrets.SERVER_ENV_PRODUCTION }}" > server/.env.production

            cat > .env.stack <<EOF
            REGISTRY=docker.io
            IMAGE_NAMESPACE=${{ steps.vars.outputs.namespace }}
            IMAGE_TAG=${{ github.sha }}
            POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
            EOF

            echo "${{ secrets.DOCKERHUB_TOKEN }}" | docker login docker.io -u "${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin

            docker compose --env-file .env.stack -f docker-compose.prod.yaml pull
            docker compose --env-file .env.stack -f docker-compose.prod.yaml up -d
            docker compose --env-file .env.stack -f docker-compose.prod.yaml run --rm ph-server sh -lc "pnpm prisma migrate deploy --schema=prisma/schema"
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

FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["pnpm", "start"]
```

### 2.5 client/Dockerfile.prod

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
RUN pnpm prune --prod

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
```

### 2.6 server/prisma.config.ts

```ts
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
```

### 2.7 scripts/set-github-secrets.ps1

```powershell
param(
    [string]$Repo,
    [string]$ServerEnvPath = "server/.env.production",
    [string]$InputSecretsPath = "ci/github-secrets.input.env"
)

$ErrorActionPreference = "Stop"

$GitHubCliPath = $null
$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
    $GitHubCliPath = $ghCommand.Source
}
if (-not $GitHubCliPath) {
    $fallbackPath = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $fallbackPath) {
        $GitHubCliPath = $fallbackPath
    }
}

function Read-EnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $values = @{}
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }

        $separatorIndex = $trimmed.IndexOf("=")
        if ($separatorIndex -lt 1) { continue }

        $key = $trimmed.Substring(0, $separatorIndex).Trim()
        $value = $trimmed.Substring($separatorIndex + 1)
        $values[$key] = $value
    }

    return $values
}

function Set-Secret {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Skipping empty secret: $Name"
        return
    }

    if ($Repo) {
        & $GitHubCliPath secret set $Name --repo $Repo --body $Value | Out-Null
    } else {
        & $GitHubCliPath secret set $Name --body $Value | Out-Null
    }

    Write-Host "Set secret: $Name"
}

if (-not $GitHubCliPath) {
    throw "GitHub CLI is required. Install it and run 'gh auth login' first."
}

$serverEnvText = Get-Content $ServerEnvPath -Raw
$inputSecrets = Read-EnvFile -Path $InputSecretsPath
$serverEnv = Read-EnvFile -Path $ServerEnvPath

$databaseUrl = $serverEnv["DATABASE_URL"]
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL not found in $ServerEnvPath"
}

$match = [regex]::Match($databaseUrl, "^postgres(?:ql)?:\/\/[^:]+:(?<pass>[^@]+)@")
if (-not $match.Success) {
    throw "Could not extract Postgres password from DATABASE_URL"
}

$encodedPassword = $match.Groups["pass"].Value
$postgresPassword = [System.Uri]::UnescapeDataString($encodedPassword)

Set-Secret -Name "DOCKERHUB_USERNAME" -Value $inputSecrets["DOCKERHUB_USERNAME"]
Set-Secret -Name "DOCKERHUB_TOKEN" -Value $inputSecrets["DOCKERHUB_TOKEN"]
Set-Secret -Name "VPS_HOST" -Value $inputSecrets["VPS_HOST"]
Set-Secret -Name "VPS_USER" -Value $inputSecrets["VPS_USER"]
Set-Secret -Name "VPS_APP_DIR" -Value $inputSecrets["VPS_APP_DIR"]
Set-Secret -Name "CLIENT_PUBLIC_API_BASE_URL" -Value $inputSecrets["CLIENT_PUBLIC_API_BASE_URL"]
Set-Secret -Name "POSTGRES_PASSWORD" -Value $postgresPassword
Set-Secret -Name "SERVER_ENV_PRODUCTION" -Value $serverEnvText

Write-Host "Done."
```

### 2.8 ci/github-secrets.input.env (template)

Do not commit real values.
Use this local-only template:

```env
# Local-only input for scripts/set-github-secrets.ps1
# Keep this file out of git.

DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_new_dockerhub_rw_token
VPS_HOST=your_vps_public_ip
VPS_USER=root
VPS_APP_DIR=/opt/apps/ph-healthcare
CLIENT_PUBLIC_API_BASE_URL=http://your_vps_public_ip/api/v1
```

---

## 3) Environment Variables: Where to Set What

### 3.1 GitHub Repository Secrets

Set these in GitHub repository settings -> Secrets and variables -> Actions:

- DOCKERHUB_USERNAME
- DOCKERHUB_TOKEN
- VPS_HOST
- VPS_USER
- VPS_SSH_KEY
- VPS_APP_DIR
- CLIENT_PUBLIC_API_BASE_URL
- POSTGRES_PASSWORD
- SERVER_ENV_PRODUCTION

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

These are generated by workflow automatically:

- server/.env.production written from SERVER_ENV_PRODUCTION secret.
- .env.stack written by workflow with REGISTRY, IMAGE_NAMESPACE, IMAGE_TAG, POSTGRES_PASSWORD.

---

## 4) GitHub Actions Process Diagrams

### 4.1 Custom CI/CD Execution Flow

```mermaid
flowchart LR
  classDef trigger fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a;
  classDef verify fill:#dcfce7,stroke:#15803d,color:#14532d;
  classDef build fill:#fef3c7,stroke:#b45309,color:#78350f;
  classDef deploy fill:#fee2e2,stroke:#be123c,color:#881337;
  classDef store fill:#ede9fe,stroke:#7c3aed,color:#4c1d95;

  TR[Trigger\npush main / pull_request main]:::trigger --> Q0

  subgraph QUALITY[quality]
    direction TB
    Q0[checkout + setup node/pnpm]:::verify --> Q1[server install + lint + prisma generate + build]:::verify --> Q2[client install + lint + build]:::verify
  end

  subgraph DOCKER[docker - push main only]
    direction TB
    D0[resolve namespace]:::build --> D1[docker login]:::build --> D2[build server image + push latest and sha]:::build --> D3[build client image + push latest and sha]:::build
  end

  subgraph DEPLOY[deploy - push main only]
    direction TB
    P0[ssh to vps]:::deploy --> P1[write server/.env.production from secret]:::deploy --> P2[write .env.stack]:::deploy --> P3[docker compose pull]:::deploy --> P4[docker compose up -d]:::deploy --> P5[prisma migrate deploy with schema path]:::deploy --> P6[prune old images]:::deploy
  end

  Q2 --> D0
  D3 --> P0
  D2 --> REG[(Docker Hub)]:::store
  D3 --> REG
```

### 4.2 Deployment Sequence (What Happens on VPS)

```mermaid
sequenceDiagram
  participant GH as GitHub Actions deploy job
  participant VPS as VPS shell session
  participant DH as Docker Hub
  participant DC as docker compose

  GH->>VPS: connect with ssh-action
  GH->>VPS: validate VPS_APP_DIR exists
  GH->>VPS: write server/.env.production from SERVER_ENV_PRODUCTION
  GH->>VPS: write .env.stack (REGISTRY, IMAGE_NAMESPACE, IMAGE_TAG, POSTGRES_PASSWORD)
  GH->>DH: docker login using DOCKERHUB_USERNAME/DOCKERHUB_TOKEN
  GH->>DC: docker compose pull
  GH->>DC: docker compose up -d
  GH->>DC: run ph-server migration command
  Note over DC: pnpm prisma migrate deploy --schema=prisma/schema
  GH->>VPS: docker image prune -f
```

---

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

## 8) Verify Deployment on VPS

```bash
cd /opt/apps/ph-healthcare
docker compose --env-file .env.stack -f docker-compose.prod.yaml ps
docker compose --env-file .env.stack -f docker-compose.prod.yaml logs --tail=200 ph-server
docker compose --env-file .env.stack -f docker-compose.prod.yaml logs --tail=200 ph-client
curl -I http://YOUR_VPS_IP
```

Open UI:

http://YOUR_VPS_IP

---

## 9) Day-2 Operations

Check status:

```bash
cd /opt/apps/ph-healthcare
docker compose --env-file .env.stack -f docker-compose.prod.yaml ps
docker ps
```

Restart services:

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml restart ph-server
docker compose --env-file .env.stack -f docker-compose.prod.yaml restart ph-client
docker compose --env-file .env.stack -f docker-compose.prod.yaml restart
```

Run migration manually:

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml run --rm ph-server sh -lc "pnpm prisma migrate deploy --schema=prisma/schema"
```

Nginx checks:

```bash
nginx -t
systemctl reload nginx
systemctl status nginx --no-pager
```

---

## 10) Troubleshooting

### 10.1 Docker Hub push fails with 401 insufficient scopes

Fix:
1. Create new Docker Hub token with Read/Write.
2. Update DOCKERHUB_TOKEN in GitHub secrets.
3. Re-run failed job.

### 10.2 Prisma schema not found in deploy job

Expected fixed configuration in this repo:
- workflow migrate command uses --schema=prisma/schema
- server image includes prisma folder and prisma.config.ts
- prisma.config.ts schema path is prisma/schema

Debug command:

```bash
cd /opt/apps/ph-healthcare
docker compose --env-file .env.stack -f docker-compose.prod.yaml run --rm ph-server sh -lc "ls -la prisma && ls -la prisma/schema"
```

### 10.3 UI not opening

Check Nginx + upstream:

```bash
nginx -t
systemctl status nginx --no-pager
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:5000
ufw status
```

---

## 11) Security Notes

- Do not commit ci/github-secrets.input.env with real values.
- Rotate any token immediately if exposed.
- Keep VPS_SSH_KEY only in GitHub secrets.
- Prefer Docker Hub access tokens over account password.

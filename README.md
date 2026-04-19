# PH Healthcare - Dockerization Series (Local Dev)


## 5-2 -> Steps to Build a Multi-Container Application

Run one-time setup commands:

```bash
docker network create ph-net

docker volume create ph-pg-data
docker volume create server-node-modules
docker volume create server-logs
docker volume create client-node-modules
```

What each volume does:

- `ph-pg-data`: persists PostgreSQL data.
- `server-node-modules`: keeps server dependencies inside container volume.
- `server-logs`: persists API access logs (`/app/logs/access.log`).
- `client-node-modules`: keeps client dependencies inside container volume.

---

## 5-4 -> Dockerizing Database Service (PostgreSQL in this project)

No Dockerfile needed here (official image is used).

Run PostgreSQL container:

```bash
docker run -d --name ph-db --network ph-net -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret123 -e POSTGRES_DB=ph_health -v ph-pg-data:/var/lib/postgresql/data postgres:16-alpine
```

---

## 5-5 -> Dockerizing Node.js Application

### File 1: `server/Dockerfile`

Use this content:

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5000

CMD ["sh", "-lc", "CI=true pnpm install && pnpm generate && pnpm dev"]
```

### File 2: `server/.dockerignore`

Use this content:

```gitignore
node_modules
dist
.git
.gitignore
.env
.env.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

### File 3: `server/.env.docker.dev`

Create this file with at least:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@ph-db:5432/ph_health?schema=public

# keep your existing required secrets/keys here
# BETTER_AUTH_SECRET=...
# BETTER_AUTH_URL=http://localhost:5000
# ACCESS_TOKEN_SECRET=...
# REFRESH_TOKEN_SECRET=...
# ACCESS_TOKEN_EXPIRES_IN=1d
# REFRESH_TOKEN_EXPIRES_IN=7d
# BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
# BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d
# EMAIL_SENDER_SMTP_USER=...
# EMAIL_SENDER_SMTP_PASS=...
# EMAIL_SENDER_SMTP_HOST=...
# EMAIL_SENDER_SMTP_PORT=...
# EMAIL_SENDER_SMTP_FROM=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google
# FRONTEND_URL=http://localhost:3000
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
# SUPER_ADMIN_EMAIL=...
# SUPER_ADMIN_PASSWORD=...
```

Build and run server:

```bash
docker build -t ph-server-dev ./server
MSYS_NO_PATHCONV=1 docker run -d --name ph-server --network ph-net --env-file ./server/.env -e CHOKIDAR_USEPOLLING=1 -e CHOKIDAR_INTERVAL=300 -p 5000:5000 -v "$PWD/server:/app" -v server-node-modules:/app/node_modules -v server-logs:/app/logs -w /app ph-server-dev sh -lc "CI=true pnpm install && pnpm generate && pnpm dev"
docker exec -it ph-server sh -lc "pnpm exec prisma migrate deploy"
```

---

## 5-6 -> Dockerizing Next.js Application

### File 1: `client/Dockerfile`

Use this content:

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["sh", "-lc", "CI=true pnpm install && pnpm exec next dev -H 0.0.0.0 -p 3000"]
```

### File 2: `client/.dockerignore`

Use this content:

```gitignore
node_modules
.next
.git
.gitignore
.env
.env.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

### File 3: `client/.env.docker.dev`

Create this file:

```env
NEXT_PUBLIC_API_BASE_URL=http://ph-server:5000/api/v1
JWT_ACCESS_SECRET=accesssecret
```

Build client image:

```bash
docker build -t ph-client-dev ./client
```

---

## 5-7 -> Running the Dockerized Next.js App with Bind Mount

Run client with hot reload:

```bash
MSYS_NO_PATHCONV=1 docker run -d --name ph-client --network ph-net --env-file ./client/.env -e CHOKIDAR_USEPOLLING=1 -e CHOKIDAR_INTERVAL=300 -e WATCHPACK_POLLING=true -p 3000:3000 -v "$PWD/client:/app" -v client-node-modules:/app/node_modules -w /app ph-client-dev sh -lc "CI=true pnpm install && pnpm exec next dev --webpack -H 0.0.0.0 -p 3000"
```

Check containers and logs:

```bash
docker ps
docker logs -f ph-server
docker logs -f ph-client
```

## 5-9 -> Adding Security Layer for Database Container

For local dev, current setup is okay. For stronger DB isolation:

- Do not publish DB port to host (remove `-p 5432:5432`).
- Keep app and DB on the same private Docker network only.
- Use strong DB credentials and store them in env files/secrets.

Secure local run command example (DB not exposed to host):

```bash
docker rm -f ph-db
docker run -d --name ph-db --network ph-net -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=change-this-password -e POSTGRES_DB=ph_health -v ph-pg-data:/var/lib/postgresql/data postgres:16-alpine
```

---

## Useful Lifecycle Commands

```bash
docker restart ph-server
docker restart ph-client
docker stop ph-client ph-server ph-db
docker rm ph-client ph-server ph-db
```






docker run -d --name ph-healthcare-db -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=ph_health -p 5432:5432 postgres

postgresql://postgres@localhost:5432/ph_health?schema=public
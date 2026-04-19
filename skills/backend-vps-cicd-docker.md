# Backend Skill: VPS + CI/CD + Docker

Use this skill when deploying a Node.js/TypeScript backend to a VPS with Docker Compose and CI/CD.

## 1) Outcome

- Backend image builds and pushes from CI.
- VPS pulls backend image and starts service.
- Database connectivity and migrations succeed.
- Nginx proxies API requests to backend on localhost.

## 2) Required Inputs

- Production `.env` values for backend.
- Docker Hub access.
- VPS SSH access.
- Postgres password and connection URL.

## 3) Backend Runtime Rules

- Use deterministic start command.
- Include required files in image (`src` or `dist`, `prisma`, config).
- Ensure env secrets are available at runtime.

## 4) CI/CD Skill Flow

1. Trigger on push to `main`.
2. Install dependencies, lint, build.
3. Build and push backend image tag `${GITHUB_SHA}`.
4. SSH deploy to VPS.
5. Pull and recreate `ph-server`.
6. Run DB migrations if needed.

## 5) GitHub Secrets Checklist

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `POSTGRES_PASSWORD`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

## 6) VPS Deployment Commands

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml pull ph-server
docker compose --env-file .env.stack -f docker-compose.prod.yaml up -d --force-recreate ph-server
docker compose --env-file .env.stack -f docker-compose.prod.yaml run --rm ph-server sh -lc "pnpm prisma migrate deploy --schema=prisma/schema"
docker logs ph-server --tail 120
```

## 7) Nginx API Check

```bash
curl -I http://127.0.0.1:5000/api/v1/
curl -I http://YOUR_PUBLIC_IP/api/v1/
nginx -t
systemctl reload nginx
```

## 8) Common Backend Failures

- Symptom: `502 Bad Gateway`.
- Fix: check `ph-server` logs and container status, then verify backend listens on `127.0.0.1:5000`.

- Symptom: `MODULE_NOT_FOUND` or ESM import error.
- Fix: validate start command, image contents, and Node module resolution strategy.

- Symptom: Prisma migration/schema issues.
- Fix: ensure `prisma` folder exists in image and run migration command manually.

- Symptom: auth token validation mismatch.
- Fix: ensure signing and verification secrets match between backend and middleware runtime.

## 9) Validation Checklist

- `ph-server` container is `Up`.
- `/api/v1/` returns valid HTTP response.
- auth endpoints return expected status.
- migrations are applied successfully.

## 10) Fast Rollback

- Set `.env.stack` `IMAGE_TAG` to last working tag.
- Recreate backend service.

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml up -d --force-recreate ph-server
```

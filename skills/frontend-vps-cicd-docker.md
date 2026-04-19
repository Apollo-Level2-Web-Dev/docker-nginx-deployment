# Frontend Skill: VPS + CI/CD + Docker

Use this skill when deploying a Next.js frontend to a VPS using Docker and GitHub Actions.

## 1) Outcome

- Frontend image builds in CI.
- Image pushes to Docker Hub.
- VPS pulls the new image and runs it with Docker Compose.
- Nginx proxies public traffic to frontend container on localhost.

## 2) Required Inputs

- Docker Hub username and token.
- VPS SSH access.
- Public IP or domain.
- Image tag strategy (recommended: commit SHA).

## 3) Frontend Docker Rules

- Build with production API base URL injected at build time.
- Expose app on port 3000 in container.
- Run with `next start -H 0.0.0.0 -p 3000`.

Example build args:

```bash
--build-arg NEXT_PUBLIC_API_BASE_URL=http://YOUR_PUBLIC_IP/api/v1
```

## 4) CI/CD Skill Flow

1. Trigger on push to `main`.
2. Run quality gates: install, lint, build.
3. Build frontend image with tag `${GITHUB_SHA}`.
4. Push image to Docker Hub.
5. SSH to VPS and pull new image.
6. Recreate frontend service.

## 5) GitHub Secrets Checklist

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `CLIENT_PUBLIC_API_BASE_URL`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

## 6) VPS Deployment Commands

From project root on VPS:

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml pull ph-client
docker compose --env-file .env.stack -f docker-compose.prod.yaml up -d --force-recreate ph-client
docker compose --env-file .env.stack -f docker-compose.prod.yaml ps
docker logs ph-client --tail 100
```

## 7) Nginx Frontend Check

```bash
curl -I http://127.0.0.1:3000
curl -I http://YOUR_PUBLIC_IP
nginx -t
systemctl status nginx --no-pager
```

## 8) Common Frontend Failures

- Symptom: old UI after deploy.
- Fix: hard refresh browser, clear cache, recreate container.

- Symptom: server action mismatch.
- Fix: deploy frontend and backend from same commit, then force recreate both services.

- Symptom: login stuck on auth page.
- Fix: verify cookies are set and middleware runtime env is present in `ph-client`.

## 9) Validation Checklist

- Homepage loads at public URL.
- Login form submits.
- Protected routes open after login.
- `docker compose ps` shows `ph-client` as `Up`.

## 10) Fast Rollback

- Set `IMAGE_TAG` in `.env.stack` to previous working tag.
- Recreate frontend service.

```bash
docker compose --env-file .env.stack -f docker-compose.prod.yaml up -d --force-recreate ph-client
```

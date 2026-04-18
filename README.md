# Nginx Demo

This guide helps you rebuild your project in 2 stages:

1. Stage 1: Reverse Proxy only
2. Stage 2: Add Load Balancing

Use Stage 1 first, then move to Stage 2.

## Project Structure

- `docker-compose.yml`
- `app/`
- `nginx/nginx.conf`

## Prerequisites

- Docker Desktop installed
- Docker Compose available

## App Setup (Required for Both Stages)

Before Stage 1 or Stage 2, create these files inside `app/`.

### 1) `app/server.js`

```js
const express = require("express");
const os = require("os");

const app = express();
const PORT = 3000;

const INSTANCE = process.env.INSTANCE_NAME || os.hostname();

app.get("/", (req, res) => {
  res.send(`Hello World from ${INSTANCE}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - ${INSTANCE}`);
});
```

### 2) `app/package.json`

```json
{
  "name": "lb-demo",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### 3) `app/Dockerfile`

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Why this is required:

- Your compose services use `build: ./app`.
- So Docker needs `app/Dockerfile` to build the app image.
- Nginx does not need a Dockerfile in this setup because it uses `nginx:latest` directly.

## Stage 1: Reverse Proxy Only

In this stage, Nginx forwards requests to one backend app.

### 1) Use this Compose file

Replace `docker-compose.yml` with:

```yaml
version: "3.9"

services:
  app1:
    build: ./app
    environment:
      - INSTANCE_NAME=App-1

  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
```

### 2) Use this Nginx config

Replace `nginx/nginx.conf` with:

```nginx
events {}

http {
    server {
        listen 80;

        location / {
            proxy_pass http://app1:3000;
        }
    }
}
```

### 3) Start and test

```bash
docker compose up --build
```

Open:

- http://localhost:8080

Expected:

- You always see response from `App-1`

This proves Reverse Proxy is working.

## Stage 2: Add Load Balancing

Now upgrade from one backend to three backends.

### 1) Update Compose for 3 app instances

Replace `docker-compose.yml` with:

```yaml
version: "3.9"

services:
  app1:
    build: ./app
    environment:
      - INSTANCE_NAME=App-1

  app2:
    build: ./app
    environment:
      - INSTANCE_NAME=App-2

  app3:
    build: ./app
    environment:
      - INSTANCE_NAME=App-3

  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3
```

### 2) Update Nginx with upstream pool

Replace `nginx/nginx.conf` with:

```nginx
events {}

http {
    upstream backend {
        server app1:3000;
        server app2:3000;
        server app3:3000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://backend;
        }
    }
}
```

### 3) Rebuild and run

```bash
docker compose up --build
```

### 4) Verify load balancing

Refresh this URL multiple times:

- http://localhost:8080

Expected:

- You should see different instance names (`App-1`, `App-2`, `App-3`) over multiple requests.

This proves Load Balancing is working.

## Quick Theory

- Reverse Proxy: Nginx accepts client request and forwards to backend service.
- Load Balancing: Nginx distributes requests across multiple backend services.

## Reset Commands (Optional)

If you want a clean restart:

```bash
docker compose down -v
docker compose up --build
```

# Docker Communication Demo

Three endpoints, each showing a different Docker networking pattern.

---

## Build the image

```bash
docker build -t docker-demo .
```

---

## Demo 1 — Container → Internet

```bash
docker run -p 3000:3000 docker-demo
curl http://localhost:3000/internet
```
The container calls JSONPlaceholder over the public internet.

---

## Demo 2 — Container → Host / Atlas


**Local MongoDB on your machine:**
```bash
docker run -d --name demo-app -p 3000:3000 \
  -e MONGO_ATLAS_URI="mongodb://host.docker.internal:27017/demo" \
  docker-demo
```

```bash
curl http://localhost:3000/host-db
```
---


## Demo 3 — Container → Container (MongoDB)

```bash
# 1. Shared network
docker network create demo-net

# 2. Start MongoDB container
docker run -d --name mongo-container --network demo-net \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7

# 3. Start app on the same network
docker run -d --name demo-app --network demo-net -p 3000:3000 \
  -e MONGO_CONTAINER_URI="mongodb://root:secret@mongo-container:27017/demo?authSource=admin" \
  docker-demo

curl http://localhost:3000/container-db
```
Docker resolves `mongo-container` as a hostname inside `demo-net`.

---

## Cleanup

```bash
docker stop demo-app mongo-container
docker rm demo-app mongo-container
docker network rm demo-net
```
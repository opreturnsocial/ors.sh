# Deploying ors.sh

Deploy ors.sh to a VPS with Caddy already running. The backend runs as a systemd service from `/opt/ors.sh`. The frontend is built and served as static files by Caddy (the backend also serves them as SPA fallback, but Caddy is faster).

**Assumed domain:** `ors.sh` (replace throughout)

---

## Phase 1 - VPS Prerequisites

### Node.js 20 + Yarn

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn
```

---

## Phase 2 - Clone and Build

```bash
sudo mkdir -p /opt/ors.sh
sudo chown $USER:$USER /opt/ors.sh
cd /opt/ors.sh
git clone <your-repo-url> .
```

### 2.1 Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```ini
DATABASE_URL="file:/opt/ors.sh/backend/prisma/prod.db"
JWT_SECRET="<generate a long random string>"
PORT=3004
BASE_URL="https://ors.sh"
FRONTEND_ORIGIN="https://ors.sh"
```

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```ini
VITE_API_URL="https://ors.sh"
```

> `VITE_API_URL` is baked into the frontend bundle at build time - set it before building.

### 2.2 Install and build

```bash
yarn install
yarn db:generate
yarn db:migrate:prod
yarn build
```

---

## Phase 3 - Systemd Service

```bash
sudo tee /etc/systemd/system/ors-sh.service <<EOF
[Unit]
Description=ors.sh backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/ors.sh/backend
ExecStart=/usr/bin/node /opt/ors.sh/backend/dist/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=/opt/ors.sh/backend/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ors-sh
sudo systemctl start ors-sh
sudo systemctl status ors-sh
```

Check logs:

```bash
journalctl -u ors-sh -f
```

---

## Phase 4 - Caddy

```caddy
ors.sh {
    # Static frontend assets (two path segments, e.g. /assets/*)
    handle /assets/* {
        root * /opt/ors.sh/frontend/dist
        file_server
    }

    # Everything else proxies to the backend
    # (handles /:id redirects, /api/*, and SPA fallback)
    reverse_proxy localhost:3004
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

---

## Phase 5 - DNS

Point an A record for `ors.sh` at your VPS IP.

---

## Verification

```bash
# Auth required - should return 401
curl https://ors.sh/api/links

# Nonexistent slug - should return the SPA (200)
curl -s https://ors.sh/999 | head -5

# Real slug - should 302 redirect
curl -I https://ors.sh/1
```

---

## Updates

```bash
cd /opt/ors.sh
git pull
yarn install
yarn db:migrate:prod
yarn build
sudo systemctl restart ors-sh
```

If the Prisma schema changed, also run `yarn db:generate` before building.

---

## Key files

| Path | Purpose |
|------|---------|
| `backend/.env` | JWT secret, DB path, ports |
| `frontend/.env` | `VITE_API_URL` (baked at build time) |
| `backend/prisma/prod.db` | SQLite database |
| `frontend/dist/` | Built frontend (served by Caddy) |
| `/etc/systemd/system/ors-sh.service` | Systemd unit |

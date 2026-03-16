# ors.sh

Short links. Sign in with your Nostr key, paste a URL, get a short link.

**[ors.sh](https://ors.sh)**

## How it works

- Auth via [NIP-98](https://github.com/nostr-protocol/nips/blob/master/98.md) - no passwords, no email
- Slugs are sequential integers (`/1`, `/2`, ...) - no vanity URLs
- Global write rate limit of 1 per 10 seconds across all users
- Redirects are plain `302`s, no tracking

## Dev setup

Requires Node 20+, Yarn.

```bash
# Install deps
yarn install

# Set up backend env
cp backend/.env.example backend/.env
# Edit backend/.env - set JWT_SECRET to something random

# Run the database migration
yarn db:migrate

# Start backend (port 3004)
yarn dev:backend

# Start frontend (port 5175) - in a second terminal
yarn dev:frontend
```

Open [http://localhost:5175](http://localhost:5175). You'll need a Nostr browser extension to sign in - [Alby](https://getalby.com) or [nos2x](https://github.com/fiatjaf/nos2x).

## Deploy

See [DEPLOY.md](docs/DEPLOY.md)

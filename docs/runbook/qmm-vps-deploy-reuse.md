# QMM VPS Deploy Reuse Guide

This document consolidates the VPS deployment patches and repeatable rebuild workflow for QMM.

## 1) Required code patches (already in repo)

These are the key patches needed for stable low-memory VPS deployment:

1. DB management scripts force SQLite URL and skip `_community` bootstrap:
   - `scripts/qmm/db/manage.ts`
   - `QMM_SKIP_BOOTSTRAP_ON_INIT=true`
2. `_community` bootstrap supports skip mode:
   - `test/_community/config.ts`
3. VPS-friendly TypeScript runner scripts:
   - root `package.json`
   - `runts:vps`, `qmm:db:status:vps`, `qmm:db:migrate:vps`
4. VPS-light package build path:
   - root `package.json`: `build:vps`
   - `packages/payload/package.json`: `build:vps`

## 2) Build strategy (important)

- `build:vps` is for lightweight package compilation only.
- Production runtime still needs Next build artifacts, so use `pnpm run build:app` before `next start`.

In short:

1. `pnpm run build:vps` (optional but recommended on low-memory VPS)
2. `pnpm run build:app` (required)

## 3) One-time VPS prerequisites

1. Install dependencies:
   - `pnpm install --frozen-lockfile`
2. Ensure DB file exists at project root:
   - `payload-qmm.db`
3. Ensure service and reverse proxy are ready:
   - `qmmee.service` (systemd)
   - nginx -> `127.0.0.1:3000`

## 4) Reusable scripts

Use these scripts from the repo root:

1. Update code + rebuild + restart:
   - `bash scripts/qmm/deploy/vps_update_build_restart.sh`
2. Rebuild only (no git pull / no restart):
   - `bash scripts/qmm/deploy/vps_rebuild.sh`
3. Health check:
   - `bash scripts/qmm/deploy/vps_healthcheck.sh`

## 5) Environment defaults used by scripts

- `PAYLOAD_DATABASE=sqlite`
- `SQLITE_URL=file:./payload-qmm.db`
- `QMM_SKIP_BOOTSTRAP_ON_INIT=true`
- `NODE_ENV=production`
- `NODE_OPTIONS=--max-old-space-size=1536 --no-deprecation`
- `PORT=3000`

You can override via env before running scripts, for example:

```bash
NODE_OPTIONS="--max-old-space-size=1024 --no-deprecation" \
SQLITE_URL="file:./payload-qmm.db" \
bash scripts/qmm/deploy/vps_rebuild.sh
```

## 6) Typical update flow

```bash
cd /usr/local/qmmee/payload_qmm_git
bash scripts/qmm/deploy/vps_update_build_restart.sh
bash scripts/qmm/deploy/vps_healthcheck.sh
```

## 7) Notes

- If `build:app` fails with DB schema errors, run:
  - `pnpm run qmm:db:status:vps`
- If migrations are needed in the future, `qmm:db:migrate:vps` is already wired.
- Request logs are in nginx access logs, not in Payload app logs by default.

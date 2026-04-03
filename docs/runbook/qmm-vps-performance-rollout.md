# QMM VPS Performance Rollout

This runbook is for low-spec VPS deployment of the current QMM web app.

## 1) What was optimized in code

- Removed forced dynamic rendering for key content pages:
  - `/` now uses `revalidate = 60`
  - `/stories` and `/stories/[slug]` now use `revalidate = 120`
- Reduced homepage data-query overhead:
  - removed per-release N+1 card queries in `qmmContent.ts`
  - switched to one batched card query and in-memory grouping
- Removed heavy debug logs from homepage content assembly path.
- Reduced write amplification in insights response API:
  - removed "clear then write" two-step update
  - switched to single update with preserved row IDs
- Added process-level payload client memoization in API + server data loaders.
- Disabled repetitive `getPayloadHMR` deprecation logging by default
  (`PAYLOAD_LOG_DEPRECATED_HMR=true` to re-enable).
- Enabled SQLite WAL and tunable busy timeout in generated test adapter template.

## 2) Recommended env for low-spec VPS

Use these env vars in production:

- `NODE_ENV=production`
- `PAYLOAD_DATABASE=sqlite`
- `SQLITE_URL=file:./payload-qmm.db`
- `SQLITE_WAL=true`
- `SQLITE_WAL_SYNCHRONOUS=NORMAL`
- `SQLITE_BUSY_TIMEOUT=5000`
- `PAYLOAD_LOG_DEPRECATED_HMR=false`
- `PORT=3000`

## 3) Deploy and restart steps on VPS

```bash
cd /path/to/payload_qmm

# 1) pull latest code
git fetch origin
git checkout main
git pull --ff-only origin main

# 2) install deps
pnpm install --frozen-lockfile

# 3) build app
PAYLOAD_DATABASE=sqlite \
SQLITE_URL=file:./payload-qmm.db \
NODE_ENV=production \
pnpm build:app

# 4) run (example: foreground)
PAYLOAD_DATABASE=sqlite \
SQLITE_URL=file:./payload-qmm.db \
SQLITE_WAL=true \
SQLITE_WAL_SYNCHRONOUS=NORMAL \
SQLITE_BUSY_TIMEOUT=5000 \
PAYLOAD_LOG_DEPRECATED_HMR=false \
NODE_ENV=production \
PORT=3000 \
pnpm exec next start -p 3000
```

If you use process managers (pm2/systemd), keep the same env vars there.

## 4) Quick production smoke check

```bash
curl -s -o /dev/null -w "home %{http_code} %{time_total}s\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "stories %{http_code} %{time_total}s\n" http://127.0.0.1:3000/stories
curl -s -o /dev/null -w "api %{http_code} %{time_total}s\n" "http://127.0.0.1:3000/api/qmm/insights/attempts/by-fingerprint?value=slow%20cloud"
```

## 5) Rollback (safe)

```bash
cd /path/to/payload_qmm
git log --oneline -n 5
# pick previous known good commit
git checkout <good_commit>

pnpm install --frozen-lockfile
PAYLOAD_DATABASE=sqlite SQLITE_URL=file:./payload-qmm.db NODE_ENV=production pnpm build:app
# restart service with the same envs
```

## 6) Notes

- If you run `pnpm dev _community`, `test/databaseAdapter.js` is regenerated from `test/generateDatabaseAdapter.ts`.
- This project still uses test-harness style config (`test/_community/config.ts`), so production build warnings from broad file tracing may appear; build can still succeed.

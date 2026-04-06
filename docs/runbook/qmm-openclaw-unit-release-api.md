# QMM OpenClaw Unit Release API (MVP)

This runbook documents the new publish-oriented APIs for direct OpenClaw integration.

## 1) Goal

Allow OpenClaw to publish a Theme-aligned Unit Release with minimal payload:

- resolve Theme -> Story -> InsightSet -> Unit -> versions
- preview before publish
- publish to make website flow effective
- read back effective releases

## 2) Endpoints

### 2.1 Preview (no write)

- `POST /api/qmm/unit-releases/publish/preview`

Example:

```json
{
  "theme": "feeling-left-behind",
  "channel": "web",
  "mode": "latest_published"
}
```

### 2.2 Publish

- `POST /api/qmm/unit-releases/publish`

Example:

```json
{
  "theme": "feeling-left-behind",
  "channel": "web",
  "mode": "latest_published",
  "activateAt": "now",
  "priority": 0,
  "trafficWeight": 100,
  "idempotencyKey": "openclaw-2026-04-03-001"
}
```

### 2.3 Effective release query

- `GET /api/qmm/unit-releases/effective?channel=web&theme=feeling-left-behind`

## 3) Request fields

- `theme` or `themeId` (required at least one)
- `channel`: `web | h5 | miniapp` (default `web`)
- `mode`:
  - `latest_published` (default)
  - `current_version`
  - `explicit` (requires `storyVersionId` + `insightSetVersionId`)
- `storySlug` / `insightSetSlug` (optional precision filters)
- `unitId` (optional explicit unit)
- `activateAt`:
  - `"now"` or ISO date string
- `durationHours` (optional)
- `priority` (optional, default 0)
- `trafficWeight` (optional, default 100)
- `status` (optional override): `scheduled | active | paused | ended`
- `idempotencyKey` (optional but recommended)
- `note` (optional)

## 4) Auth

If env var exists, request must include Bearer token:

- `QMM_OPENCLAW_API_TOKEN` (preferred)
- fallback: `QMM_OPENCLAW_TOKEN` or `QMM_API_TOKEN`

Header:

```http
Authorization: Bearer <token>
```

If no token env var is configured, APIs are open in local/dev.

## 5) Front-end effectiveness check

API responses include checks for website readiness:

- story must be published
- selected insightSetVersion must have active cards
- release schedule/channel/status compatibility

## 6) Notes

- Publish API writes `audienceRule.openclaw.*` metadata for traceability.
- When publishing `status=active`, existing active release conflicts on same `unit + channel` are
  auto-archived by existing hook.

# QMM DB Runbook

## Initialize

1. Start dev server: `pnpm dev _community`
2. Generate types: `pnpm dev:generate-types _community`

## Migration Scripts

- `pnpm qmm:db:status`
- `pnpm qmm:db:migrate`
- `pnpm qmm:db:down`
- `pnpm qmm:db:fresh`

## Seed Scripts

- `pnpm qmm:seed:taxonomy`
- `pnpm qmm:seed:stories`
- `pnpm qmm:seed:insights`
- `pnpm qmm:seed:release`
- `pnpm qmm:seed:demo`
- `pnpm qmm:seed:all`

## Notes

- Seed scripts are idempotent where possible.
- Run taxonomy first, then stories/insights, then release.

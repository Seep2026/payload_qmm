# QMM Theme Minimal Flow

This phase implements only the **Theme minimal business loop** in Payload CMS.

## Scope in this phase

Payload CMS is the source of truth for Theme data.

Implemented:

- Create theme
- Query theme
- Update theme status
- Archive theme

Not implemented in this phase:

- Story flow
- Insight cards flow
- CrewAI logic

## Data source boundary

- Theme truth source: Payload collection `themes`
- Business access boundary: `test/_community/qmm/services/themeService.ts`
- Future OpenClaw integration should call `themeService` (or a thin adapter around it), not direct database SQL.

## Minimal validation script

Run:

```bash
pnpm runts ./scripts/test-theme-flow.ts
```

The script validates:

1. create `feeling-left-behind`
2. query by slug
3. update status to `operating`
4. archive theme
5. verify `status === archived` and `archivedAt` is populated

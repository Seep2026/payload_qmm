# QMM Release Resolution

## Goal

Resolve which `storyVersion + insightSetVersion` a user sees for a specific unit.

## Input

- `unitID`
- `channel` (`web`, `h5`, `miniapp`)
- optional `at` timestamp

## Resolution Logic

1. Query `unit-releases` by `unitID + channel + status=active`.
2. Sort by descending `priority`.
3. Keep records that satisfy release window: `startAt <= at < endAt` (if endAt exists).
4. Select first match.

## Output

- release record
- associated `storyVersion`
- associated `insightSetVersion`

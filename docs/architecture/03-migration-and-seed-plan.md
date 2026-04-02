# QMM Migration and Seed Plan

## Scope

This plan defines how qmm.ee domain data is introduced in the `_community` Payload config.

## Migration Batches

1. `m001_init_qmm_collections`: qmm domain schema introduced through collection config.
2. `m002_indexes_compound`: placeholder for DB-specific compound index SQL.
3. `m003_integrity_constraints`: placeholder for DB-level integrity constraints.
4. `m004_backfill_normalize`: placeholder for historical data normalization.

## Seed Stages

1. `s001_seed_taxonomy`: themes and tags.
2. `s002_seed_story_versions`: story and story versions.
3. `s003_seed_insight_versions`: insight set, version, and cards.
4. `s004_seed_unit_releases`: one-to-one unit and active release.
5. `s005_seed_demo_attempts`: demo attempts and responses.

## Safety

- Seeds are idempotent by slug/version matching.
- Release integrity is enforced by collection hooks before DB-level constraints.

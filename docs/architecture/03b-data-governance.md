# QMM Data Governance

## Tag Lifecycle

`active -> cold -> merge_candidate -> deprecated -> archived`

## Theme Lifecycle

`defined -> operating -> expanding -> iterating -> split -> archived`

## Story Lifecycle

`draft -> pending -> published -> testing -> archived`

## Version Lifecycle

`draft -> review -> published -> retired`

## Release Lifecycle

`scheduled -> active -> paused -> ended`

## Governance Rules

- One story belongs to one theme.
- One story can have many tags.
- Tag and theme have no direct relation.
- One `insight set` maps to one `story` via `insight-story-units`.
- At most one active release per `unit + channel`.

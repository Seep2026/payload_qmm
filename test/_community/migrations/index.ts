import * as m001 from './20260317_120000_m001_init_qmm_collections.js'
import * as m002 from './20260317_121000_m002_indexes_compound.js'
import * as m003 from './20260317_122000_m003_integrity_constraints.js'
import * as m004 from './20260317_123000_m004_backfill_normalize.js'
import * as m005 from './20260401_114000_m005_add_theme_to_insight_sets.js'

export const migrations = [
  {
    name: '20260317_120000_m001_init_qmm_collections',
    ...m001,
  },
  {
    name: '20260317_121000_m002_indexes_compound',
    ...m002,
  },
  {
    name: '20260317_122000_m003_integrity_constraints',
    ...m003,
  },
  {
    name: '20260317_123000_m004_backfill_normalize',
    ...m004,
  },
  {
    name: '20260401_114000_m005_add_theme_to_insight_sets',
    ...m005,
  },
]

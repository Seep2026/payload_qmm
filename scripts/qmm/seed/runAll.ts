import { seedTaxonomy } from './s001_seed_taxonomy.js'
import { seedStoryVersions } from './s002_seed_story_versions.js'
import { seedInsightVersions } from './s003_seed_insight_versions.js'
import { seedUnitReleases } from './s004_seed_unit_releases.js'
import { seedDemoAttempts } from './s005_seed_demo_attempts.js'

export const runAllSeeds = async () => {
  await seedTaxonomy()
  await seedStoryVersions()
  await seedInsightVersions()
  await seedUnitReleases()
  await seedDemoAttempts()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void runAllSeeds()
}

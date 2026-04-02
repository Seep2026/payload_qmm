import { FingerprintLexiconReleasesCollection } from './fingerprintLexiconReleases.js'
import { InsightAttemptsCollection } from './insightAttempts.js'
import { InsightCardsCollection } from './insightCards.js'
import { InsightResponsesCollection } from './insightResponses.js'
import { InsightRunsCollection } from './insightRuns.js'
import { InsightSetsCollection } from './insightSets.js'
import { InsightSetVersionsCollection } from './insightSetVersions.js'
import { InsightStoryUnitsCollection } from './insightStoryUnits.js'
import { StoriesCollection } from './stories.js'
import { StoryVersionsCollection } from './storyVersions.js'
import { TagsCollection } from './tags.js'
import { ThemesCollection } from './themes.js'
import { UnitReleasesCollection } from './unitReleases.js'

export const qmmCollections = [
  ThemesCollection,
  TagsCollection,
  StoriesCollection,
  StoryVersionsCollection,
  InsightSetsCollection,
  InsightSetVersionsCollection,
  InsightCardsCollection,
  InsightStoryUnitsCollection,
  UnitReleasesCollection,
  FingerprintLexiconReleasesCollection,
  InsightRunsCollection,
  InsightAttemptsCollection,
  InsightResponsesCollection,
]

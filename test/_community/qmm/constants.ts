export const qmmSlugs = {
  fingerprintLexiconReleases: 'fingerprint-lexicon-releases',
  insightAttempts: 'insight-attempts',
  insightCards: 'insight-cards',
  insightResponses: 'insight-responses',
  insightRuns: 'insight-runs',
  insightSets: 'insight-sets',
  insightSetVersions: 'insight-set-versions',
  insightStoryUnits: 'insight-story-units',
  media: 'media',
  stories: 'stories',
  storyVersions: 'story-versions',
  tags: 'tags',
  themes: 'themes',
  unitReleases: 'unit-releases',
} as const

export const responseOptions = [
  { label: 'Off', value: 'off' },
  { label: 'Unsure', value: 'unsure' },
  { label: 'Right', value: 'right' },
] as const

export const versionStatuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Review', value: 'review' },
  { label: 'Published', value: 'published' },
  { label: 'Retired', value: 'retired' },
] as const

export const releaseStatuses = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Ended', value: 'ended' },
] as const

export const storyStatuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Published', value: 'published' },
  { label: 'Testing', value: 'testing' },
  { label: 'Archived', value: 'archived' },
] as const

export const themeStatuses = [
  { label: 'Defined', value: 'defined' },
  { label: 'Operating', value: 'operating' },
  { label: 'Expanding', value: 'expanding' },
  { label: 'Iterating', value: 'iterating' },
  { label: 'Split', value: 'split' },
  { label: 'Archived', value: 'archived' },
] as const

export const tagStatuses = [
  { label: 'Active', value: 'active' },
  { label: 'Cold', value: 'cold' },
  { label: 'Merge Candidate', value: 'merge_candidate' },
  { label: 'Deprecated', value: 'deprecated' },
  { label: 'Archived', value: 'archived' },
] as const

export const attemptStatuses = [
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Dropped', value: 'dropped' },
] as const

export const unitStatuses = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
] as const

export const releaseChannels = [
  { label: 'Web', value: 'web' },
  { label: 'H5', value: 'h5' },
  { label: 'Mini App', value: 'miniapp' },
] as const

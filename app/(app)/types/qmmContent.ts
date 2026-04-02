export type InsightOption = 'off' | 'unsure' | 'right'

export const insightOptionLabels: Record<InsightOption, string> = {
  off: 'Off',
  unsure: 'Unsure',
  right: 'Right',
}

export type StoryArticle = {
  content: string[]
  date: string
  excerpt: string
  slug: string
  subtitle: string
  tags: string[]
  title: string
}

export type InsightExperienceUnit = {
  key: string
  statements: string[]
  story: StoryArticle
  storySlug: string
  themeId: string
  themeName: string
  themeSentence: string
}

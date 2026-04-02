import { qmmSlugs } from '../test/_community/qmm/constants.js'
import {
  archiveTheme,
  createTheme,
  getThemeBySlug,
  updateThemeStatus,
} from '../test/_community/qmm/services/themeService.js'
import { getPayloadClient } from './qmm/seed/_shared.js'

const TEST_THEME = {
  description: 'A theme about feeling others are moving ahead',
  name: 'Feeling Left Behind',
  priority: 10,
  slug: 'feeling-left-behind',
  status: 'defined' as const,
}

const run = async () => {
  const payload = await getPayloadClient()

  payload.logger.info({ msg: '[theme-flow] start minimal theme flow validation' })

  const existing = await getThemeBySlug(payload, TEST_THEME.slug)

  if (existing) {
    await payload.delete({
      id: existing.id,
      collection: qmmSlugs.themes,
      depth: 0,
    })
    payload.logger.info({ msg: `[theme-flow] cleaned existing theme: ${TEST_THEME.slug}` })
  }

  const created = await createTheme(payload, TEST_THEME)
  payload.logger.info({
    msg: `[theme-flow] created theme: slug=${created.slug} status=${created.status} priority=${created.priority}`,
  })

  const queried = await getThemeBySlug(payload, TEST_THEME.slug)

  if (!queried) {
    throw new Error('[theme-flow] query failed: theme not found after create')
  }

  payload.logger.info({
    msg: `[theme-flow] queried theme: slug=${queried.slug} status=${queried.status}`,
  })

  const updated = await updateThemeStatus(payload, TEST_THEME.slug, 'operating')

  if (!updated) {
    throw new Error('[theme-flow] update failed: theme not found for status update')
  }

  payload.logger.info({
    msg: `[theme-flow] updated theme status: slug=${updated.slug} status=${updated.status}`,
  })

  const archived = await archiveTheme(payload, TEST_THEME.slug)

  if (!archived) {
    throw new Error('[theme-flow] archive failed: theme not found for archive')
  }

  const archivedAt = archived.archivedAt || ''

  if (archived.status !== 'archived') {
    throw new Error('[theme-flow] archive validation failed: status is not archived')
  }

  if (!archivedAt) {
    throw new Error('[theme-flow] archive validation failed: archivedAt is empty')
  }

  payload.logger.info({
    msg: `[theme-flow] archived theme: slug=${archived.slug} status=${archived.status} archivedAt=${archivedAt}`,
  })
  payload.logger.info({ msg: '[theme-flow] PASS' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void run()
}

export { run }

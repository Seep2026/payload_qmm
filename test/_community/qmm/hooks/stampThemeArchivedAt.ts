import type { CollectionBeforeChangeHook } from 'payload'

const normalizeStatus = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const hasArchivedAt = (value: unknown): boolean => {
  if (value instanceof Date) {
    return true
  }

  return typeof value === 'string' && value.trim().length > 0
}

export const stampThemeArchivedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const next = data as Record<string, unknown>
  const nextStatus = normalizeStatus(next.status)
  const currentStatus = normalizeStatus(originalDoc?.status)
  const isArchived =
    nextStatus === 'archived' || (nextStatus === '' && currentStatus === 'archived')

  if (isArchived && !hasArchivedAt(next.archivedAt) && !hasArchivedAt(originalDoc?.archivedAt)) {
    next.archivedAt = new Date().toISOString()
  }

  return next
}

import type { CollectionBeforeValidateHook } from 'payload'

import { toKebabCase } from '../utils.js'

type NormalizeSlugOptions = {
  fallbackField?: string
  slugField?: string
}

export const normalizeSlugBeforeValidate = (
  options: NormalizeSlugOptions = {},
): CollectionBeforeValidateHook => {
  const fallbackField = options.fallbackField || 'title'
  const slugField = options.slugField || 'slug'

  return ({ data }) => {
    if (!data || typeof data !== 'object') {
      return data
    }

    const doc = data as Record<string, unknown>

    const slug = typeof doc[slugField] === 'string' ? doc[slugField] : ''
    const fallback = typeof doc[fallbackField] === 'string' ? doc[fallbackField] : ''

    if (slug || fallback) {
      doc[slugField] = toKebabCase(slug || fallback)
    }

    return doc
  }
}

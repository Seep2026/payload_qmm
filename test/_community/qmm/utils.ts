export const toKebabCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const relationToID = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const candidate = (value as { id?: number | string }).id
    if (typeof candidate === 'number' || typeof candidate === 'string') {
      return candidate
    }
  }

  return undefined
}

export const asArray = <T>(value: null | T | T[] | undefined): T[] => {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

import type { BasePayload } from 'payload'

import { qmmSlugs } from '../constants.js'

export type ThemeStatus = 'archived' | 'defined' | 'expanding' | 'iterating' | 'operating' | 'split'

export type ThemeModel = {
  archivedAt?: null | string
  createdAt?: null | string
  description?: null | string
  id: number | string
  name: string
  priority: number
  slug: string
  status: ThemeStatus
  updatedAt?: null | string
}

export type CreateThemeInput = {
  description?: string
  name: string
  priority?: number
  slug?: string
  status?: ThemeStatus
}

const isThemeStatus = (value: unknown): value is ThemeStatus =>
  value === 'defined' ||
  value === 'operating' ||
  value === 'expanding' ||
  value === 'iterating' ||
  value === 'split' ||
  value === 'archived'

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const toThemeModel = (value: unknown): ThemeModel => {
  if (!value || typeof value !== 'object') {
    throw new Error('Theme document is invalid.')
  }

  const doc = value as Record<string, unknown>
  const name = normalizeText(doc.name)
  const slug = normalizeText(doc.slug)
  const status = isThemeStatus(doc.status) ? doc.status : 'defined'
  const id = doc.id

  if (!name || !slug || (typeof id !== 'number' && typeof id !== 'string')) {
    throw new Error('Theme document missing required fields.')
  }

  return {
    id,
    name,
    slug,
    archivedAt: normalizeText(doc.archivedAt || doc.archived_at) || null,
    createdAt: normalizeText(doc.createdAt || doc.created_at) || null,
    description: normalizeText(doc.description) || null,
    priority: typeof doc.priority === 'number' ? doc.priority : Number(doc.priority) || 0,
    status,
    updatedAt: normalizeText(doc.updatedAt || doc.updated_at) || null,
  }
}

const findThemeDocBySlug = async (
  payload: BasePayload,
  slug: string,
): Promise<null | Record<string, unknown>> => {
  const targetSlug = normalizeText(slug)

  if (!targetSlug) {
    return null
  }

  const result = await payload.find({
    collection: qmmSlugs.themes,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: targetSlug,
      },
    },
  })

  const doc = result.docs?.[0]

  if (!doc || typeof doc !== 'object') {
    return null
  }

  return doc as Record<string, unknown>
}

export const createTheme = async (
  payload: BasePayload,
  input: CreateThemeInput,
): Promise<ThemeModel> => {
  const created = await payload.create({
    collection: qmmSlugs.themes,
    data: {
      name: normalizeText(input.name),
      slug: normalizeText(input.slug) || undefined,
      description: normalizeText(input.description) || undefined,
      priority: typeof input.priority === 'number' ? input.priority : 0,
      status: input.status || 'defined',
    },
    depth: 0,
  })

  return toThemeModel(created)
}

export const listThemes = async (payload: BasePayload): Promise<ThemeModel[]> => {
  const result = await payload.find({
    collection: qmmSlugs.themes,
    depth: 0,
    limit: 200,
    sort: '-priority',
  })

  return result.docs.map((doc) => toThemeModel(doc))
}

export const getThemeBySlug = async (
  payload: BasePayload,
  slug: string,
): Promise<null | ThemeModel> => {
  const doc = await findThemeDocBySlug(payload, slug)
  return doc ? toThemeModel(doc) : null
}

export const updateThemeStatus = async (
  payload: BasePayload,
  slug: string,
  status: ThemeStatus,
): Promise<null | ThemeModel> => {
  const doc = await findThemeDocBySlug(payload, slug)

  if (!doc) {
    return null
  }

  const updated = await payload.update({
    id: doc.id as number | string,
    collection: qmmSlugs.themes,
    data: {
      status,
    },
    depth: 0,
  })

  return toThemeModel(updated)
}

export const archiveTheme = async (
  payload: BasePayload,
  slug: string,
): Promise<null | ThemeModel> => {
  return await updateThemeStatus(payload, slug, 'archived')
}

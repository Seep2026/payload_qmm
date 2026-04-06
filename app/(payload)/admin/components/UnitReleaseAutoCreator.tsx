'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from '@payloadcms/ui/forms/Form'

type ThemeOption = {
  id: number | string
  label: string
}

type PreviewResolution = {
  insightSet: {
    id: number | string | null
    name: string
    slug: string
    status: string
  }
  insightSetVersion: {
    displayTitle: string
    id: number | string | null
    status: string
    version: string
  }
  mode: string
  story: {
    id: number | string | null
    slug: string
    status: string
    title: string
  }
  storyVersion: {
    displayTitle: string
    id: number | string | null
    status: string
    version: string
  }
  theme: {
    id: number | string | null
    name: string
    slug: string
    status: string
  }
  unit: {
    displayTitle: string
    id: number | string | null
    status: string
  }
  warnings: string[]
}

type PreviewPayload = {
  checks: {
    activeCardCount: number
    readyForFrontEnd: boolean
    reasons: string[]
  }
  conflicts: {
    activeReleaseCountSameUnitChannel: number
    releases: Array<{
      channel?: string
      id?: number | string
      priority?: number
      startAt?: string
      status?: string
    }>
  }
  resolution: PreviewResolution
  unitCreatedInPreview: boolean
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const badgeStyle = (tone: 'danger' | 'ok' | 'warn') => {
  if (tone === 'ok') {
    return {
      background: '#e8f5e9',
      color: '#1b5e20',
    }
  }

  if (tone === 'warn') {
    return {
      background: '#fff8e1',
      color: '#8d6e00',
    }
  }

  return {
    background: '#ffebee',
    color: '#b71c1c',
  }
}

export const UnitReleaseAutoCreator: React.FC = () => {
  const { setValue } = useForm()

  const [themes, setThemes] = useState<ThemeOption[]>([])
  const [selectedThemeID, setSelectedThemeID] = useState<string>('')
  const [preview, setPreview] = useState<null | PreviewPayload>(null)
  const [previewError, setPreviewError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    void loadThemes()
  }, [])

  useEffect(() => {
    if (!selectedThemeID) {
      setPreview(null)
      setPreviewError('')
      setMessage('')
      return
    }

    void loadPreview(selectedThemeID)
  }, [selectedThemeID])

  const selectedTheme = useMemo(
    () => themes.find((theme) => String(theme.id) === selectedThemeID) || null,
    [selectedThemeID, themes],
  )

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/themes?limit=200&depth=0&sort=name')
      const data = (await response.json()) as { docs?: Array<Record<string, unknown>> }
      const docs = data.docs || []

      setThemes(
        docs.map((doc) => ({
          id: (doc.id as number | string) || '',
          label: normalizeText(doc.name) || `Theme ${String(doc.id ?? '')}`,
        })),
      )
    } catch {
      setPreviewError('Failed to load themes.')
    }
  }

  const loadPreview = async (themeID: string) => {
    setIsLoadingPreview(true)
    setPreview(null)
    setPreviewError('')
    setMessage('')

    try {
      const response = await fetch('/api/qmm/unit-releases/publish/preview', {
        body: JSON.stringify({
          channel: 'web',
          mode: 'latest_published',
          themeId: themeID,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = (await response.json()) as PreviewPayload & { error?: string }

      if (!response.ok) {
        setPreviewError(data.error || 'Failed to resolve release preview.')
        return
      }

      setPreview(data)
    } catch {
      setPreviewError('Failed to request preview.')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const applyToForm = () => {
    if (!preview?.resolution) {
      setMessage('Cannot apply: preview is missing.')
      return
    }

    const unitID = preview.resolution.unit.id
    const storyVersionID = preview.resolution.storyVersion.id
    const insightSetVersionID = preview.resolution.insightSetVersion.id

    if (!unitID || !storyVersionID || !insightSetVersionID) {
      setMessage('Cannot apply: one or more required IDs are missing in preview.')
      return
    }

    setValue('themeId', selectedThemeID)
    setValue('unit', unitID)
    setValue('storyVersion', storyVersionID)
    setValue('insightSetVersion', insightSetVersionID)

    // Keep defaults explicit so operator can still override in native fields.
    setValue('channel', 'web')
    setValue('status', 'scheduled')
    setValue('priority', 0)
    setValue('trafficWeight', 100)

    setMessage(
      'Resolved IDs have been applied. Review schedule/status fields below, then click Save.',
    )
  }

  const hasPreview = Boolean(preview?.resolution)

  return (
    <section
      style={{
        background: '#f8fafc',
        border: '1px solid #dbe4ee',
        borderRadius: 8,
        marginBottom: 24,
        padding: 20,
      }}
    >
      <h2 style={{ fontSize: 20, margin: 0 }}>Unit Release Resolver</h2>
      <p style={{ color: '#475569', margin: '8px 0 0' }}>
        Select a Theme, preview the exact Story + InsightSet + Version mapping, then apply resolved
        IDs to the form.
      </p>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Theme</label>
        <select
          onChange={(event) => {
            setSelectedThemeID(event.target.value)
          }}
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
            padding: '8px 10px',
            width: '100%',
          }}
          value={selectedThemeID}
        >
          <option value="">-- Select Theme --</option>
          {themes.map((theme) => (
            <option key={String(theme.id)} value={String(theme.id)}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      {isLoadingPreview ? (
        <div style={{ color: '#64748b', marginTop: 16 }}>Resolving relationships...</div>
      ) : null}

      {previewError ? (
        <div
          style={{
            ...badgeStyle('danger'),
            borderRadius: 6,
            marginTop: 16,
            padding: '10px 12px',
          }}
        >
          {previewError}
        </div>
      ) : null}

      {hasPreview && preview ? (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 16, margin: '0 0 10px' }}>Resolution Snapshot</h3>
          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #edf2f7', fontWeight: 600, padding: 8, width: '26%' }}>
                    Theme
                  </td>
                  <td style={{ borderBottom: '1px solid #edf2f7', padding: 8 }}>
                    {preview.resolution.theme.name} ({preview.resolution.theme.slug || 'no-slug'}) ·{' '}
                    {preview.resolution.theme.status || 'unknown'}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #edf2f7', fontWeight: 600, padding: 8 }}>
                    Story
                  </td>
                  <td style={{ borderBottom: '1px solid #edf2f7', padding: 8 }}>
                    {preview.resolution.story.title} · {preview.resolution.story.status || 'unknown'}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #edf2f7', fontWeight: 600, padding: 8 }}>
                    Story Version
                  </td>
                  <td style={{ borderBottom: '1px solid #edf2f7', padding: 8 }}>
                    {preview.resolution.storyVersion.displayTitle || preview.resolution.storyVersion.version} · ID:{' '}
                    {String(preview.resolution.storyVersion.id ?? '-')}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #edf2f7', fontWeight: 600, padding: 8 }}>
                    Insight Set
                  </td>
                  <td style={{ borderBottom: '1px solid #edf2f7', padding: 8 }}>
                    {preview.resolution.insightSet.name} · {preview.resolution.insightSet.status || 'unknown'}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #edf2f7', fontWeight: 600, padding: 8 }}>
                    Insight Version
                  </td>
                  <td style={{ borderBottom: '1px solid #edf2f7', padding: 8 }}>
                    {preview.resolution.insightSetVersion.displayTitle ||
                      preview.resolution.insightSetVersion.version}{' '}
                    · ID: {String(preview.resolution.insightSetVersion.id ?? '-')}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: 8 }}>Unit</td>
                  <td style={{ padding: 8 }}>
                    {preview.resolution.unit.displayTitle || `Unit ${String(preview.resolution.unit.id ?? '-')}`}{' '}
                    · ID: {String(preview.resolution.unit.id ?? '-')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
            <span
              style={{
                ...badgeStyle(preview.checks.readyForFrontEnd ? 'ok' : 'warn'),
                borderRadius: 999,
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
              }}
            >
              {preview.checks.readyForFrontEnd
                ? `Front-end ready (${preview.checks.activeCardCount} active cards)`
                : 'Not front-end ready'}
            </span>
          </div>

          {preview.checks.reasons.length ? (
            <ul style={{ color: '#92400e', margin: '10px 0 0', paddingLeft: 20 }}>
              {preview.checks.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}

          {preview.resolution.warnings.length ? (
            <ul style={{ color: '#7c2d12', margin: '10px 0 0', paddingLeft: 20 }}>
              {preview.resolution.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {preview.conflicts.activeReleaseCountSameUnitChannel > 0 ? (
            <div
              style={{
                ...badgeStyle('warn'),
                borderRadius: 6,
                marginTop: 12,
                padding: '10px 12px',
              }}
            >
              {preview.conflicts.activeReleaseCountSameUnitChannel} active release(s) currently exist
              for this unit + channel and will be auto-archived if you save with status=active.
            </div>
          ) : null}

          <div style={{ marginTop: 14, textAlign: 'right' }}>
            <button
              onClick={applyToForm}
              style={{
                background: '#0f172a',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                padding: '8px 14px',
              }}
              type="button"
            >
              Apply Resolved IDs to Form
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            ...badgeStyle('ok'),
            borderRadius: 6,
            marginTop: 14,
            padding: '10px 12px',
          }}
        >
          {message}
        </div>
      ) : null}

      {selectedTheme && !isLoadingPreview && !hasPreview && !previewError ? (
        <div style={{ color: '#64748b', marginTop: 16 }}>
          No preview data returned. Please verify related Story / InsightSet / Version data.
        </div>
      ) : null}
    </section>
  )
}

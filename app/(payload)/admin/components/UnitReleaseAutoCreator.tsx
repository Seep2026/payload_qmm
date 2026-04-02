'use client'

import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useForm } from '@payloadcms/ui/forms/Form'
import { SelectInput } from '@payloadcms/ui/fields/Select'
import { DateTimeInput } from '@payloadcms/ui/fields/DateTime'
import { NumberInput } from '@payloadcms/ui/fields/Number'
import { TextInput } from '@payloadcms/ui/fields/Text'
import { CheckboxInput } from '@payloadcms/ui/fields/Checkbox'

// This component provides a simplified Unit Release creation experience
// User only needs to select a Theme, and the system auto-fills everything else

export const UnitReleaseAutoCreator: React.FC = () => {
  const { getData, setValue } = useForm()
  const config = useConfig()

  const [themes, setThemes] = useState<any[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [preview, setPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load all themes on mount
    loadThemes()
  }, [])

  useEffect(() => {
    if (selectedTheme) {
      generatePreview()
    } else {
      setPreview(null)
    }
  }, [selectedTheme])

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/themes?limit=100&depth=0')
      const data = await response.json()
      setThemes(data.docs || [])
    } catch (error) {
      console.error('Failed to load themes:', error)
    }
  }

  const generatePreview = async () => {
    if (!selectedTheme) return

    setIsLoading(true)
    try {
      // Fetch theme details
      const themeResponse = await fetch(`/api/themes/${selectedTheme}?depth=2`)
      const theme = await themeResponse.json()

      // Find associated story
      const storiesResponse = await fetch(
        `/api/stories?where[theme][equals]=${selectedTheme}&depth=2&limit=1`,
      )
      const storiesData = await storiesResponse.json()
      const story = storiesData.docs?.[0]

      // Find associated insightSet
      const insightSetsResponse = await fetch(
        `/api/insight-sets?where[theme][equals]=${selectedTheme}&depth=2&limit=1`,
      )
      const insightSetsData = await insightSetsResponse.json()
      const insightSet = insightSetsData.docs?.[0]

      // Find or create unit
      let unit = null
      if (story && insightSet) {
        const unitsResponse = await fetch(
          `/api/insight-story-units?where[and][0][story][equals]=${story.id}&where[and][1][insightSet][equals]=${insightSet.id}&depth=2&limit=1`,
        )
        const unitsData = await unitsResponse.json()
        unit = unitsData.docs?.[0]
      }

      // Find latest story version
      let storyVersion = null
      if (story) {
        const storyVersionsResponse = await fetch(
          `/api/story-versions?where[story][equals]=${story.id}&depth=2&sort=-createdAt&limit=1`,
        )
        const storyVersionsData = await storyVersionsResponse.json()
        storyVersion = storyVersionsData.docs?.[0]
      }

      // Find latest insightSet version
      let insightSetVersion = null
      if (insightSet) {
        const insightSetVersionsResponse = await fetch(
          `/api/insight-set-versions?where[insightSet][equals]=${insightSet.id}&depth=2&sort=-createdAt&limit=1`,
        )
        const insightSetVersionsData = await insightSetVersionsResponse.json()
        insightSetVersion = insightSetVersionsData.docs?.[0]
      }

      setPreview({
        theme: { id: theme.id, name: theme.name },
        story: story ? { id: story.id, title: story.title } : null,
        insightSet: insightSet ? { id: insightSet.id, name: insightSet.name } : null,
        unit: unit ? { id: unit.id, displayTitle: unit.displayTitle || `Unit ${unit.id}` } : null,
        storyVersion: storyVersion
          ? {
              id: storyVersion.id,
              version: storyVersion.version,
              storyTitle: story?.title || 'Unknown Story',
              status: storyVersion.status || 'draft',
            }
          : null,
        insightSetVersion: insightSetVersion
          ? {
              id: insightSetVersion.id,
              version: insightSetVersion.version,
              insightSetName: insightSet?.name || 'Unknown InsightSet',
              status: insightSetVersion.status || 'draft',
            }
          : null,
      })
    } catch (error) {
      console.error('Failed to generate preview:', error)
      setPreview({ error: 'Failed to load preview. Please check data integrity.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)

    // Clear previous values
    setValue('unit', '')
    setValue('storyVersion', '')
    setValue('insightSetVersion', '')
  }

  const applyAutoFill = () => {
    if (!preview || preview.error) {
      alert('Cannot auto-fill: Preview is incomplete or contains errors.')
      return
    }

    if (!preview.unit || !preview.storyVersion || !preview.insightSetVersion) {
      alert(
        'Cannot auto-fill: Missing required relationships. Please ensure all related records exist.',
      )
      return
    }

    // Auto-fill the form fields
    setValue('unit', preview.unit.id)
    setValue('storyVersion', preview.storyVersion.id)
    setValue('insightSetVersion', preview.insightSetVersion.id)

    // Store themeId for the autoCreateUnitIfNeeded hook
    setValue('themeId', selectedTheme)

    // Set sensible defaults for other fields
    setValue('status', 'scheduled')
    setValue('channel', 'web')
    setValue('priority', 0)
    setValue('trafficWeight', 100)

    alert('✅ Form auto-filled successfully! You can now configure the release schedule and save.')
  }

  const themeOptions = themes.map((theme: any) => ({
    label: theme.name || `Theme ${theme.id}`,
    value: theme.id,
  }))

  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>
        Quick Unit Release Creator
      </h2>
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          borderLeft: '4px solid #2196f3',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#1976d2' }}>
          How to create a Unit Release:
        </h3>
        <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#0d47a1' }}>
          <li>
            <strong>Select a Theme</strong> from the dropdown below
          </li>
          <li>Review the preview to ensure all relationships are correct (✅ green = good)</li>
          <li>
            Click <strong>"Auto-Fill Form"</strong> to automatically fill all version fields
          </li>
          <li>Scroll down to configure the release schedule (Status, Start At, Priority)</li>
          <li>
            Click <strong>Save</strong> to create the Unit Release
          </li>
        </ol>
      </div>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Select a Theme below, and the system will automatically find all associated records and fill
        the form for you.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Theme (Required)
        </label>
        <select
          value={selectedTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          <option value="">-- Select a Theme --</option>
          {themeOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
          <strong>What happens when you select a Theme:</strong>
          <br />
          • Finds the Story and InsightSet linked to this Theme
          <br />
          • Finds the Unit that connects the Story and InsightSet
          <br />
          • Finds the latest published versions of the Story and InsightSet
          <br />
          • Displays all relationships in the Preview below
          <br />• Click "Auto-Fill Form" to automatically fill all version fields
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading preview...
        </div>
      )}

      {!isLoading && preview && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Preview</h3>

          {preview.error ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: '4px',
                color: '#c62828',
              }}
            >
              <strong>Error:</strong> {preview.error}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                        width: '30%',
                      }}
                    >
                      Theme:
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {preview.theme ? (
                        preview.theme.name
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Not found</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                      }}
                    >
                      Story:
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {preview.story ? (
                        preview.story.title
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Not found</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                      }}
                    >
                      InsightSet:
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {preview.insightSet ? (
                        preview.insightSet.name
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Not found</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                      }}
                    >
                      Unit:
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {preview.unit ? (
                        <span style={{ color: '#4caf50' }}>✅ {preview.unit.displayTitle}</span>
                      ) : (
                        <span style={{ color: '#ff9800' }}>⚠️ Will be auto-created</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                      }}
                    >
                      Story Version:
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {preview.storyVersion ? (
                        <div>
                          <span style={{ color: '#4caf50' }}>
                            ✅ {preview.storyVersion.storyTitle}
                          </span>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                            Version: <strong>v{preview.storyVersion.version}</strong> | Status:{' '}
                            <span
                              style={{
                                color:
                                  preview.storyVersion.status === 'published'
                                    ? '#4caf50'
                                    : '#ff9800',
                                textTransform: 'capitalize',
                              }}
                            >
                              {preview.storyVersion.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Not found</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>InsightSet Version:</td>
                    <td style={{ padding: '0.5rem' }}>
                      {preview.insightSetVersion ? (
                        <div>
                          <span style={{ color: '#4caf50' }}>
                            ✅ {preview.insightSetVersion.insightSetName}
                          </span>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                            Version: <strong>v{preview.insightSetVersion.version}</strong> | Status:{' '}
                            <span
                              style={{
                                color:
                                  preview.insightSetVersion.status === 'published'
                                    ? '#4caf50'
                                    : '#ff9800',
                                textTransform: 'capitalize',
                              }}
                            >
                              {preview.insightSetVersion.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Not found</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #ccc' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Note:</strong> When you click "Auto-Fill Form", the system will:
                </p>
                <ul
                  style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#666' }}
                >
                  <li>Link all related records automatically</li>
                  <li>Set default values for status, channel, and priority</li>
                  <li>Allow you to configure the schedule before saving</li>
                </ul>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button
              type="button"
              onClick={applyAutoFill}
              disabled={!selectedTheme || !preview || preview.error}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: !selectedTheme || !preview || preview.error ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: !selectedTheme || !preview || preview.error ? 'not-allowed' : 'pointer',
              }}
            >
              Auto-Fill Form
            </button>
          </div>
        </div>
      )}

      {!isLoading && !preview && selectedTheme && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No preview available. Please ensure all related records exist.
        </div>
      )}
    </div>
  )
}

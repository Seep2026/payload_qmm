'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { InsightExperienceUnit, InsightOption } from '../../types/qmmContent'
import {
  FINGERPRINTS_UPDATED_EVENT,
  generateFingerprintRecord,
  isBrowserStorageAvailable,
  saveRecentFingerprint,
  type ReflectionFingerprintRecord,
} from '../../utils/fingerprints'
import { computeResultKey } from '../../utils/insightResult'
import {
  completeInsightRun,
  saveInsightResponse,
  startInsightRun,
} from '../../utils/insightRunPersistence'
import { ResultPanel } from './ResultPanel'
import { ResponseControls } from './ResponseControls'
import { StoryReveal } from './StoryReveal'

const exitClassMap: Record<InsightOption, string> = {
  off: 'is-exit-left',
  unsure: 'is-exit-up',
  right: 'is-exit-right',
}

const fallbackTheme: InsightExperienceUnit = {
  key: 'fallback',
  statements: [],
  story: {
    content: [],
    date: '',
    excerpt: '',
    slug: '',
    subtitle: '',
    tags: [],
    title: '',
  },
  storySlug: '',
  themeId: 'fallback-theme',
  themeName: 'No active theme',
  themeSentence: 'No active insight release is published yet.',
}

type InsightsExperienceProps = {
  initialUnits: InsightExperienceUnit[]
}

export const InsightsExperience = ({ initialUnits }: InsightsExperienceProps) => {
  const units = initialUnits
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<InsightOption | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isStoryExpanded, setIsStoryExpanded] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [isThemeSwitching, setIsThemeSwitching] = useState(false)
  const [responseHistory, setResponseHistory] = useState<InsightOption[]>([])
  const [fingerprintRecord, setFingerprintRecord] = useState<null | ReflectionFingerprintRecord>(
    null,
  )
  const [activeRunId, setActiveRunId] = useState<null | string>(null)
  const runInitializationPromiseRef = useRef<null | Promise<null | string>>(null)
  const questionShownAtRef = useRef<number>(Date.now())

  const activeTheme = units[currentThemeIndex] || units[0] || fallbackTheme
  const total = activeTheme?.statements.length || 0
  const currentStatement =
    activeTheme?.statements[currentIndex] ||
    activeTheme?.statements[0] ||
    'No insight cards are currently published for this experience.'
  const featuredStory = useMemo(() => activeTheme.story, [activeTheme.story])
  const hasStory = Boolean(featuredStory?.slug)

  useEffect(() => {
    setIsEntering(true)
    const timer = setTimeout(() => setIsEntering(false), 220)
    return () => clearTimeout(timer)
  }, [currentIndex])

  useEffect(() => {
    questionShownAtRef.current = Date.now()
  }, [currentIndex, currentThemeIndex])

  const ensureActiveRunId = async (): Promise<null | string> => {
    if (activeRunId) {
      return activeRunId
    }

    if (runInitializationPromiseRef.current) {
      return await runInitializationPromiseRef.current
    }

    const nextPromise = startInsightRun({
      storySlug: activeTheme.storySlug,
      themeId: activeTheme.themeId,
      themeName: activeTheme.themeName,
      themeSentence: activeTheme.themeSentence,
    })
      .then((created) => {
        const nextRunId = created?.runId || null

        if (nextRunId) {
          setActiveRunId(nextRunId)
        }

        return nextRunId
      })
      .catch(() => null)
      .finally(() => {
        runInitializationPromiseRef.current = null
      })

    runInitializationPromiseRef.current = nextPromise

    return await nextPromise
  }

  const handleResponse = async (option: InsightOption) => {
    if (isAnimating || isThemeSwitching || !total) {
      return
    }

    const runIdForWrite = await ensureActiveRunId()
    const nextResponses = [...responseHistory, option]
    const answerOrder = nextResponses.length
    const answeredAt = new Date().toISOString()
    const latencyMs = Math.max(0, Date.now() - questionShownAtRef.current)

    if (runIdForWrite) {
      void saveInsightResponse(runIdForWrite, {
        answeredAt,
        cardKey: `${activeTheme.key}:${currentIndex + 1}`,
        latencyMs,
        option,
        order: answerOrder,
        statement: currentStatement,
      })
    }

    setResponseHistory(nextResponses)
    setIsAnimating(true)
    setExitDirection(option)

    setTimeout(async () => {
      if (currentIndex < total - 1) {
        setCurrentIndex((prev) => prev + 1)
        setExitDirection(null)
        setIsAnimating(false)
      } else {
        const resultKey = computeResultKey(nextResponses)
        let nextFingerprint = generateFingerprintRecord({
          resultKey,
          storyId: activeTheme.storySlug,
          themeId: activeTheme.themeId,
          themeName: activeTheme.themeName,
          version: 'fp_local_fallback_v1',
        })

        if (runIdForWrite) {
          const completedRun = await completeInsightRun(runIdForWrite, {
            completedAt: new Date().toISOString(),
            resultKey,
            resultSnapshot: {
              options: nextResponses,
              storySlug: activeTheme.storySlug,
              themeId: activeTheme.themeId,
              themeName: activeTheme.themeName,
              totalCards: total,
            },
          })

          if (completedRun?.fingerprintPhrase) {
            nextFingerprint = {
              ...nextFingerprint,
              fingerprintPhrase: completedRun.fingerprintPhrase,
              version: completedRun.fingerprintVersion || nextFingerprint.version,
            }
          }
        }

        setFingerprintRecord(nextFingerprint)

        if (isBrowserStorageAvailable()) {
          const storageResult = saveRecentFingerprint(nextFingerprint)
          window.dispatchEvent(
            new CustomEvent(FINGERPRINTS_UPDATED_EVENT, {
              detail: storageResult,
            }),
          )
        }

        setIsCompleted(true)
      }
    }, 340)
  }

  const handleTryAgain = () => {
    setCurrentIndex(0)
    setIsAnimating(false)
    setExitDirection(null)
    setIsCompleted(false)
    setIsStoryExpanded(false)
    setResponseHistory([])
    setFingerprintRecord(null)
    setActiveRunId(null)
    runInitializationPromiseRef.current = null
  }

  const handleThemeSwitch = () => {
    if (isThemeSwitching || units.length < 2) {
      return
    }

    const nextThemeIndex = (currentThemeIndex + 1) % units.length

    setIsThemeSwitching(true)

    setTimeout(() => {
      setCurrentThemeIndex(nextThemeIndex)
      setCurrentIndex(0)
      setIsAnimating(false)
      setExitDirection(null)
      setIsCompleted(false)
      setResponseHistory([])
      setFingerprintRecord(null)
      setActiveRunId(null)
      runInitializationPromiseRef.current = null
    }, 170)

    setTimeout(() => {
      setIsThemeSwitching(false)
    }, 390)
  }

  const handleOpenSeepQMM = () => {
    // Placeholder action. Wire this to Seep IM deep-link when available.
    window.open('https://seep.im', '_blank', 'noopener,noreferrer')
  }

  if (isCompleted) {
    return (
      <div className="qmm-experience">
        {isThemeSwitching ? <div aria-hidden="true" className="qmm-theme-veil" /> : null}
        <ResultPanel
          fingerprintPhrase={fingerprintRecord?.fingerprintPhrase || ''}
          onNewInsight={handleTryAgain}
          onOpenSeep={handleOpenSeepQMM}
        />
      </div>
    )
  }

  return (
    <div className="qmm-experience">
      {isThemeSwitching ? <div aria-hidden="true" className="qmm-theme-veil" /> : null}
      <section className="qmm-shell qmm-insight-area">
        <div className="qmm-insight-topline">
          <button
            className="qmm-theme-trigger"
            disabled={isAnimating || isThemeSwitching}
            onClick={handleThemeSwitch}
            type="button"
          >
            {activeTheme.themeSentence}
          </button>
          <span className="qmm-insight-progress">
            {currentIndex + 1} of {total}
          </span>
        </div>

        <article
          className={[
            'qmm-insight-card',
            isEntering ? 'is-enter' : '',
            exitDirection ? exitClassMap[exitDirection] : '',
          ]
            .join(' ')
            .trim()}
        >
          <p>{currentStatement}</p>
        </article>
      </section>

      <ResponseControls disabled={isAnimating || total === 0} onResponse={handleResponse} />
      {hasStory ? (
        <StoryReveal
          article={featuredStory}
          expanded={isStoryExpanded}
          onToggle={() => setIsStoryExpanded((prev) => !prev)}
        />
      ) : (
        <section className="qmm-shell qmm-story-reveal">
          <p className="qmm-empty-note">
            No published story is linked to this insight release yet.
          </p>
        </section>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import {
  FINGERPRINTS_UPDATED_EVENT,
  clearFirstFingerprintHint,
  hasPendingFirstFingerprintHint,
  isBrowserStorageAvailable,
  readRecentFingerprints,
  type ReflectionFingerprintRecord,
} from '../../utils/fingerprints'

type SiteHeaderProps = {
  active: 'insights' | 'stories'
}

export const SiteHeader = ({ active }: SiteHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isStorageAvailable, setIsStorageAvailable] = useState(false)
  const [recentRecords, setRecentRecords] = useState<ReflectionFingerprintRecord[]>([])
  const [shouldHighlight, setShouldHighlight] = useState(false)

  const utilityRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const available = isBrowserStorageAvailable()

    setIsStorageAvailable(available)

    if (!available) {
      return
    }

    setRecentRecords(readRecentFingerprints())
    setShouldHighlight(hasPendingFirstFingerprintHint())

    const handleFingerprintsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ isFirstStored?: boolean; records?: unknown[] }>
      const records = Array.isArray(customEvent.detail?.records)
        ? (customEvent.detail.records as ReflectionFingerprintRecord[])
        : readRecentFingerprints()

      setRecentRecords(records)

      if (customEvent.detail?.isFirstStored) {
        setShouldHighlight(true)
      }
    }

    window.addEventListener(FINGERPRINTS_UPDATED_EVENT, handleFingerprintsUpdated)

    return () => {
      window.removeEventListener(FINGERPRINTS_UPDATED_EVENT, handleFingerprintsUpdated)
    }
  }, [])

  useEffect(() => {
    if (!isDropdownOpen) {
      return
    }

    const handleOutsidePointer = (event: MouseEvent) => {
      const target = event.target as Node | null

      if (utilityRef.current && target && !utilityRef.current.contains(target)) {
        setIsDropdownOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsidePointer)

    return () => {
      window.removeEventListener('mousedown', handleOutsidePointer)
    }
  }, [isDropdownOpen])

  const handleIconClick = () => {
    if (!isStorageAvailable) {
      return
    }

    setIsDropdownOpen((prev) => !prev)

    if (shouldHighlight) {
      clearFirstFingerprintHint()
      setShouldHighlight(false)
    }
  }

  const tooltip = isStorageAvailable ? 'Recent fingerprints' : 'Recent fingerprints unavailable'

  return (
    <header className="qmm-header">
      <div className="qmm-shell qmm-header-inner">
        <Link className="qmm-brand" href="/">
          <img alt="Qmm.ee" className="qmm-brand-logo" src="/brand/qmm-logo.svg" />
        </Link>

        <nav className="qmm-nav" aria-label="Primary">
          <Link className={active === 'insights' ? 'is-active' : ''} href="/">
            Insights
          </Link>
          <Link className={active === 'stories' ? 'is-active' : ''} href="/stories">
            Stories
          </Link>
        </nav>

        <div className="qmm-header-utility" ref={utilityRef}>
          <button
            aria-expanded={isDropdownOpen}
            className={[
              'qmm-fingerprint-btn',
              !isStorageAvailable ? 'is-disabled' : '',
              shouldHighlight ? 'is-highlighted' : '',
            ]
              .join(' ')
              .trim()}
            onClick={handleIconClick}
            title={tooltip}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4.5c-3.3 0-6 2.7-6 6v2.1" />
              <path d="M12 7.5c-1.7 0-3 1.3-3 3v4.3" />
              <path d="M12 10.5v6.7" />
              <path d="M15 10.5v4.8" />
              <path d="M9 10.5v4.8" />
              <path d="M18 10.5v2.7" />
            </svg>
          </button>

          {isStorageAvailable && isDropdownOpen ? (
            <section className="qmm-fingerprint-dropdown">
              <h3>Recent fingerprints</h3>

              {recentRecords.length ? (
                <ul>
                  {recentRecords.map((record) => (
                    <li key={`${record.createdAt}-${record.fingerprintPhrase}`}>
                      <span>{record.themeName}</span>
                      <strong>{record.fingerprintPhrase}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="qmm-fingerprint-empty">No fingerprints yet.</p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </header>
  )
}

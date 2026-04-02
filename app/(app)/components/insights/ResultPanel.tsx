type ResultPanelProps = {
  fingerprintPhrase: string
  onNewInsight: () => void
  onOpenSeep: () => void
}

export const ResultPanel = ({ fingerprintPhrase, onNewInsight, onOpenSeep }: ResultPanelProps) => {
  return (
    <section className="qmm-shell qmm-result-wrap">
      <div className="qmm-result-island">
        <h1>Insight complete.</h1>

        <section className="qmm-result-fingerprint-group">
          <p className="qmm-fingerprint-label">Your fingerprint:</p>
          <p className="qmm-fingerprint-value">{`⌁ ${fingerprintPhrase} ⌁`}</p>
        </section>

        <p className="qmm-result-bridge">Send this fingerprint to QMM on Seep</p>

        <div className="qmm-fingerprint-actions">
          <button className="qmm-result-primary-btn" onClick={onOpenSeep} type="button">
            Open Seep
          </button>
          <button className="qmm-result-secondary-btn" onClick={onNewInsight} type="button">
            New Insight
          </button>
        </div>
      </div>
    </section>
  )
}

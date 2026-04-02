import type { InsightOption } from '../../types/qmmContent'
import { insightOptionLabels } from '../../types/qmmContent'

type ResponseControlsProps = {
  disabled?: boolean
  onResponse: (option: InsightOption) => void
}

const options: InsightOption[] = ['off', 'unsure', 'right']

export const ResponseControls = ({ disabled = false, onResponse }: ResponseControlsProps) => {
  return (
    <div className="qmm-shell qmm-response-wrap">
      <div className="qmm-response-grid">
        {options.map((option) => (
          <button
            key={option}
            className="qmm-response-btn"
            disabled={disabled}
            onClick={() => onResponse(option)}
            type="button"
          >
            {insightOptionLabels[option]}
          </button>
        ))}
      </div>
    </div>
  )
}

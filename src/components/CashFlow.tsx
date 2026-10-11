import type { CashFlow as CashFlowShape } from '../types'
import { CASH_FLOOR_PCT } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Line, Money, Pct, Section } from './ui'

const LINES: { key: keyof CashFlowShape; label: string }[] = [
  { key: 'stock_sells', label: 'Stock sells' },
  { key: 'stock_buys', label: 'Stock buys' },
  { key: 'dividends', label: 'Dividends' },
  { key: 'premiums_received', label: 'Option premiums received' },
  { key: 'buybacks_paid', label: 'Option buybacks paid' },
  { key: 'assignment_cash', label: 'Assignment cash' },
  { key: 'net_vs_prior_week', label: 'Net cash change vs prior week' },
]

export function CashFlow({ model }: { model: Model }) {
  const flow = model.snap.cash_flow
  return (
    <Section
      index="02"
      title="Cash flow"
      note="Signed amounts are shown as stored. This seed has no cash-flow object, so the lines stay blank. The cash ratio below is derived from cash and NAV."
    >
      {LINES.map((line) => (
        <Line key={line.key} label={line.label} strong={line.key === 'net_vs_prior_week'}>
          <Money value={flow?.[line.key]} signed />
        </Line>
      ))}
      <Line label="Cash vs 1% of NAV" strong>
        {model.cashPercent == null ? (
          <Money value={null} />
        ) : (
          <span className={model.cashFlag ? 'down' : 'up'}>
            <Pct value={model.cashPercent} plain />
            {model.cashFlag ? ` · below ${CASH_FLOOR_PCT}%` : ` · at or above ${CASH_FLOOR_PCT}%`}
          </span>
        )}
      </Line>
    </Section>
  )
}

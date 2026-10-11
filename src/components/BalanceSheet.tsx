import { assignmentTotal } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Line, Missing, Money, Section } from './ui'

const SLEEVE_NAMES = ['Core TML', 'Non-core', 'Levered ETF']

export function BalanceSheet({ model }: { model: Model }) {
  const { broker, snap } = model
  const positions = snap.options_book?.positions ?? null
  const assignment = positions ? assignmentTotal(positions) : null
  const brokerSum =
    broker.ibTotal != null && broker.hsbcTotal != null ? broker.ibTotal + broker.hsbcTotal : null
  const stockMv = broker.ibMv != null && broker.hsbcMv != null ? broker.ibMv + broker.hsbcMv : null

  return (
    <Section
      index="01"
      title="Balance sheet"
      note="Equity-book NAV from broker totals. Option assignment is a memo until the snapshot carries notionals."
    >
      {stockMv != null && stockMv > 0 && broker.ibMv != null && broker.hsbcMv != null ? (
        <>
          <div className="split" aria-hidden>
            <span className="ib" style={{ flex: broker.ibMv }} />
            <span className="hsbc" style={{ flex: broker.hsbcMv }} />
          </div>
          <p className="legend">
            <i className="swatch ib" /> IB stock
            <i className="swatch hsbc" /> HSBC stock
          </p>
        </>
      ) : null}

      <p className="group-label">Assets</p>
      <Line label="IB stock market value">
        <Money value={broker.ibMv} />
      </Line>
      <Line label="HSBC stock market value">
        <Money value={broker.hsbcMv} />
      </Line>
      <Line label="IB cash">
        <Money value={broker.ibCash} />
      </Line>
      <Line label="HSBC cash">
        <Money value={broker.hsbcCash} />
      </Line>
      <Line label="Cash, book total">
        <Money value={snap.cash} />
      </Line>
      {sleeveLines(model)}
      <Line label="Options collateral, memo">
        <Missing detail="no collateral field" />
      </Line>

      <p className="group-label">Liabilities and equity</p>
      <Line label="Short-put assignment notional">
        {snap.options_book == null ? (
          <Missing detail="no options book" />
        ) : assignment == null ? (
          <span className="missing">No assignment notionals on the options book</span>
        ) : (
          <Money value={assignment} />
        )}
      </Line>
      <Line label="Broker totals, IB + HSBC" strong>
        <Money value={brokerSum} />
      </Line>
      <Line label="Equity book NAV" strong>
        <Money value={snap.nav} />
      </Line>
      <p className="fine">{tieNote(model, brokerSum)}</p>
    </Section>
  )
}

function sleeveLines(model: Model) {
  const sleeves = model.snap.sleeves
  if (sleeves == null) {
    return SLEEVE_NAMES.map((name) => (
      <Line key={name} label={`Sleeve · ${name}`}>
        <Missing />
      </Line>
    ))
  }
  if (sleeves.length === 0) {
    return (
      <Line label="Sleeves">
        <span className="missing">Snapshot included an empty sleeve list</span>
      </Line>
    )
  }
  return sleeves.map((sleeve) => (
    <Line key={sleeve.name} label={`Sleeve · ${sleeve.name}`}>
      <Money value={sleeve.mv} />
    </Line>
  ))
}

function tieNote(model: Model, brokerSum: number | null): string {
  if (model.broker.totalsTieNav == null || brokerSum == null) {
    return 'NAV tie-out needs broker totals and NAV.'
  }
  if (model.broker.totalsTieNav) return 'IB total plus HSBC total ties to NAV.'
  return 'IB total plus HSBC total does not tie to NAV. Both figures are shown as stored.'
}

import { formatIsoDate, formatPct, formatUsd, gradeTone } from '../lib/format'
import { CASH_FLOOR_PCT, HEAT_CAP_PCT, type Model } from '../lib/metrics'
import { Kpi, Missing, Money, Pct, Pp } from './ui'

export function Scorecard({ model }: { model: Model }) {
  const overall = model.snap.scorecard_seed?.overall
  const { move } = model
  const heatWidth = model.heat == null ? 0 : Math.min((model.heat / HEAT_CAP_PCT) * 100, 100)
  const namesDiffer =
    model.nameCountStated != null && model.nameCountStated !== model.nameCountListed

  return (
    <section className="card scorecard">
      <div className="grade-wrap">
        <div>
          <p className="kicker">Overall</p>
          {overall ? (
            <p className={`grade ${gradeTone(overall)}`}>{overall}</p>
          ) : (
            <p className="grade">
              <Missing />
            </p>
          )}
        </div>
        <div className="dims" aria-label="Dimension grades">
          {model.dimensions.length === 0 ? (
            <Missing detail="scorecard dimensions" />
          ) : (
            model.dimensions.map((dimension) => (
              <div key={dimension.key} className="dim">
                <span>{dimension.label}</span>
                <strong className={gradeTone(dimension.grade)}>{dimension.grade}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="kpis">
        <Kpi label="NAV" value={model.snap.nav == null ? <Missing /> : <Money value={model.snap.nav} />} sub="Equity book" />
        <Kpi
          label="Window change"
          value={move.deltaUsd == null ? <Missing /> : <Money value={move.deltaUsd} signed />}
          sub={model.bookPct == null ? 'Return not in snapshot' : <Pct value={model.bookPct} />}
        />
        <Kpi label="Excess vs SPY" value={<Pp value={model.excessSpy} />} sub="NAV log minus SPY" />
        <Kpi label="Excess vs QQQ" value={<Pp value={model.excessQqq} />} sub="NAV log minus QQQ" />
        <Kpi
          label="Heat"
          flag={model.heatOverCap}
          value={model.heat == null ? <Missing /> : <Pct value={model.heat} plain />}
          sub={
            <>
              {HEAT_CAP_PCT}% cap
              <span className={model.heatOverCap ? 'meter over' : 'meter'} aria-hidden>
                <span style={{ width: `${heatWidth}%` }} />
              </span>
            </>
          }
        />
        <Kpi
          label="Cash"
          flag={model.cashFlag}
          value={model.snap.cash == null ? <Missing /> : <Money value={model.snap.cash} />}
          sub={
            model.cashPercent == null ? (
              'Cash % needs NAV'
            ) : (
              <>
                {formatPct(model.cashPercent).replace('+', '')} of NAV
                {model.cashFlag ? ` · below ${CASH_FLOOR_PCT}%` : ''}
              </>
            )
          }
        />
        <Kpi
          label="Names"
          value={model.nameCountStated ?? model.nameCountListed}
          sub={namesDiffer ? `List has ${model.nameCountListed}` : 'Holdings in the snapshot'}
        />
        <Kpi
          label="Window"
          value={
            move.startBar && move.endBar ? (
              <span className="window-value">
                {formatIsoDate(move.startBar, 'short')}
                <span className="arrow"> → </span>
                {formatIsoDate(move.endBar, 'short')}
              </span>
            ) : (
              <Missing />
            )
          }
          sub="US close dates"
        />
      </div>
      <p className="note return-note">{returnNote(model)}</p>
      {move.startNav != null && move.endNav != null ? (
        <p className="fine">
          NAV log {move.startBar}: {formatUsd(move.startNav)} → {move.endBar}: {formatUsd(move.endNav)}
          {move.statedPct != null ? ` · stated harold_pct ${formatPct(move.statedPct)}` : ''}
        </p>
      ) : null}
    </section>
  )
}

function returnNote(model: Model): string {
  const { move, bookPct, bookSource } = model
  if (bookPct == null) return 'Book return is not in the snapshot, and the NAV log does not contain both window closes.'
  if (bookSource === 'nav_log' && move.withinTolerance === true && move.statedPct != null) {
    return `Book return ${formatPct(bookPct)} is recomputed from the NAV log. It matches stated harold_pct ${formatPct(move.statedPct)} within 0.05 pp. Excess versus each benchmark uses the log return.`
  }
  if (bookSource === 'nav_log' && move.withinTolerance === false && move.statedPct != null && move.recomputedPct != null) {
    return `NAV-log return is ${formatPct(move.recomputedPct)} and stated harold_pct is ${formatPct(move.statedPct)}. The gap is over 0.05 pp, so excess uses the log.`
  }
  if (bookSource === 'stated') {
    return 'The NAV log has no row for one side of the window. Excess uses the stated book return.'
  }
  return 'Book return is recomputed from the NAV log. The snapshot has no stated harold_pct to compare.'
}

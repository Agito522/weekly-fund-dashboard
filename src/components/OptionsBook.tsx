import type { OptionPosition } from '../types'
import { formatPx, formatUsd } from '../lib/format'
import { assignmentTotal, coveredCalls, nearTermOptions, shortPuts } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Line, Missing, Money, Section } from './ui'

export function OptionsBook({ model }: { model: Model }) {
  const book = model.snap.options_book
  const positions = book?.positions ?? null
  const puts = positions ? shortPuts(positions) : null
  const calls = positions ? coveredCalls(positions) : null
  const near = positions ? nearTermOptions(positions) : null
  const assignment = positions ? assignmentTotal(positions) : null
  const assigned = positions ? positions.filter((position) => typeof position.assignment_notional === 'number') : null

  return (
    <div className="stack">
      <Section
        index="01"
        title="Premium income"
        note="Week and month-to-date premium are snapshot fields. Nothing is estimated from the stock book."
      >
        <Line label="Premium income, week">
          <Money value={book?.premium_income_wow} signed />
        </Line>
        <Line label="Premium income, MTD">
          <Money value={book?.premium_income_mtd} signed />
        </Line>
        {book == null ? <p className="fine">This file has no options_book object.</p> : null}
      </Section>

      <Section
        index="02"
        title="Open short puts"
        note="Positions with structure short_put or csp, or right P when they are not covered calls."
      >
        <PositionTable rows={puts} empty="The options book has no open short puts." />
      </Section>

      <Section
        index="03"
        title="Covered calls"
        note="Kept apart from the short-put book. Included when structure is covered_call."
      >
        <PositionTable rows={calls} empty="The options book has no covered calls." />
      </Section>

      <Section index="04" title="Assignment notional" note="Memo liability. Shown only from assignment_notional on each position.">
        <Line label="Total assignment notional" strong>
          {book == null ? (
            <Missing detail="no options book" />
          ) : assignment == null ? (
            <span className="missing">No assignment notionals on the options book</span>
          ) : (
            <Money value={assignment} />
          )}
        </Line>
        <PositionTable rows={assigned} empty="No position carries an assignment notional." notionals />
      </Section>

      <Section
        index="05"
        title="Near-term option risk"
        note="Listed when DTE is 7 or less, itm is true, or moneyness mentions ATM or near. Moneyness is not inferred from the stock price."
      >
        <PositionTable rows={near} empty="No open position is inside 7 DTE, near ATM, or flagged ITM." />
      </Section>
    </div>
  )
}

function PositionTable({
  rows,
  empty,
  notionals = false,
}: {
  rows: OptionPosition[] | null
  empty: string
  notionals?: boolean
}) {
  if (rows == null) return <p className="missing">Not in snapshot</p>
  if (rows.length === 0) return <p className="missing">{empty}</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Underlying</th>
            <th>Structure</th>
            <th>Right</th>
            <th className="num">Strike</th>
            <th>Expiry</th>
            <th className="num">DTE</th>
            <th>ITM</th>
            {notionals ? <th className="num">Notional</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((position, index) => (
            <tr key={`${position.ticker ?? 'row'}-${position.expiry ?? ''}-${position.strike ?? index}`}>
              <td className="ticker">{position.ticker ?? '—'}</td>
              <td>{position.structure ?? '—'}</td>
              <td>{position.right ?? '—'}</td>
              <td className="num">{position.strike == null ? '—' : formatPx(position.strike)}</td>
              <td>{position.expiry ?? '—'}</td>
              <td className="num">{position.dte ?? '—'}</td>
              <td>{position.itm == null ? '—' : position.itm ? 'Yes' : 'No'}</td>
              {notionals ? (
                <td className="num">
                  {position.assignment_notional == null ? '—' : formatUsd(position.assignment_notional)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { formatPlainPct, formatUsd, statusLabel } from '../lib/format'
import { OVERSIZE_RISK_PCT } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Missing, Pct, Section } from './ui'

export function Risk({ model, index = '05' }: { model: Model; index?: string }) {
  return (
    <Section
      index={index}
      title="Process and risk"
      note={`Exit list is every holding whose status is 2nd_close_below_stop. Oversize means price-to-stop dollars exceed ${OVERSIZE_RISK_PCT}% of NAV. Names already through the stop stay on the exit list.`}
    >
      <div className="grid-2">
        <div>
          <p className="group-label">Exit signals · {model.exits.length}</p>
          {model.exits.length === 0 ? (
            <p className="missing">No holding has status 2nd_close_below_stop.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Broker</th>
                    <th className="num">Market value</th>
                    <th className="num">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {model.exits.map((holding) => (
                    <tr key={holding.ticker}>
                      <td className="ticker">{holding.ticker}</td>
                      <td>{holding.broker ?? '—'}</td>
                      <td className="num">{holding.mv == null ? '—' : formatUsd(holding.mv)}</td>
                      <td className="num">
                        <Pct value={holding.pnl_pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <p className="group-label">Oversize to stop · {model.oversize.length}</p>
          {model.stopsMissing > 0 ? (
            <p className="fine">{model.stopsMissing} holdings have no stop, so risk-to-stop is not computed for them.</p>
          ) : null}
          {model.oversize.length === 0 ? (
            <p className="missing">No holding has more than {OVERSIZE_RISK_PCT}% of NAV at risk to its stop.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Broker</th>
                    <th className="num">To stop</th>
                    <th className="num">% NAV</th>
                  </tr>
                </thead>
                <tbody>
                  {model.oversize.map((row) => (
                    <tr key={row.ticker}>
                      <td className="ticker">{row.ticker}</td>
                      <td>{row.broker}</td>
                      <td className="num">{formatUsd(row.riskUsd)}</td>
                      <td className="num down">{formatPlainPct(row.riskPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <p className="group-label">Options ≤7 DTE, near ATM, or ITM</p>
      {model.snap.options_book == null ? (
        <Missing detail="no options book" />
      ) : (
        <p className="note">Open the Options tab for the near-term screen.</p>
      )}
    </Section>
  )
}

export function StatusCounts({ model }: { model: Model }) {
  if (model.statusCounts.length === 0) return <Missing detail="holding status" />
  return (
    <div className="dims">
      {model.statusCounts.map((row) => (
        <div key={row.status} className="dim">
          <span>{statusLabel(row.status)}</span>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  )
}

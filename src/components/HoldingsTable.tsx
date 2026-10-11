import type { Holding } from '../types'
import { formatPx, formatShares, formatUsd, statusLabel, statusTone } from '../lib/format'
import { finite, OVERSIZE_RISK_PCT } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Pct, Section } from './ui'

export function HoldingsTable({ model }: { model: Model }) {
  const nav = finite(model.snap.nav)
  const rows = [...(model.snap.holdings ?? [])].sort(
    (a, b) => (finite(b.mv) ?? Number.NEGATIVE_INFINITY) - (finite(a.mv) ?? Number.NEGATIVE_INFINITY),
  )

  return (
    <Section
      index="01"
      title="Holdings"
      note="Sorted by market value. P&L % is the snapshot field. Dollars versus cost are price minus cost, times shares."
    >
      {rows.length === 0 ? (
        <p className="missing">Not in snapshot</p>
      ) : (
        <div className="table-wrap">
          <table className="holdings">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Broker</th>
                <th className="num">Shares</th>
                <th className="num hide-sm">Cost</th>
                <th className="num">Price</th>
                <th className="num">Market value</th>
                <th className="num">P&L %</th>
                <th className="num hide-sm">Vs cost</th>
                <th className="num hide-sm">Stop</th>
                <th className="num">To stop</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((holding) => (
                <tr key={holding.ticker}>
                  <td className="ticker">{holding.ticker}</td>
                  <td>{holding.broker ?? '—'}</td>
                  <td className="num">{holding.shares == null ? '—' : formatShares(holding.shares)}</td>
                  <td className="num hide-sm">{holding.cost == null ? '—' : formatPx(holding.cost)}</td>
                  <td className="num">{holding.price == null ? '—' : formatPx(holding.price)}</td>
                  <td className="num">{holding.mv == null ? '—' : formatUsd(holding.mv)}</td>
                  <td className="num">
                    <Pct value={holding.pnl_pct} />
                  </td>
                  <td className="num hide-sm">
                    <VsCost holding={holding} />
                  </td>
                  <td className="num hide-sm">{holding.stop == null ? '—' : formatPx(holding.stop)}</td>
                  <td className="num">
                    <ToStop holding={holding} nav={nav} />
                  </td>
                  <td>
                    {holding.status ? (
                      <span className={statusTone(holding.status)}>{statusLabel(holding.status)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function VsCost({ holding }: { holding: Holding }) {
  const shares = finite(holding.shares)
  const price = finite(holding.price)
  const cost = finite(holding.cost)
  if (shares == null || price == null || cost == null) return <span className="missing">—</span>
  const pnl = (price - cost) * shares
  const text = `${pnl < 0 ? '−' : pnl > 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return <span className={pnl > 0 ? 'up' : pnl < 0 ? 'down' : ''}>{text}</span>
}

function ToStop({ holding, nav }: { holding: Holding; nav: number | null }) {
  if (holding.stop == null || holding.price == null || holding.shares == null || nav == null || nav === 0) {
    return <span className="missing">—</span>
  }
  if (holding.price <= holding.stop) return <span className="down">Through stop</span>
  const pct = (((holding.price - holding.stop) * holding.shares) / nav) * 100
  return <span className={pct > OVERSIZE_RISK_PCT ? 'down' : ''}>{pct.toFixed(2)}%</span>
}

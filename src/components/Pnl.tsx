import { formatUsd } from '../lib/format'
import { shortPuts } from '../lib/metrics'
import type { Model } from '../lib/metrics'
import { Line, Missing, Money, Pct, Section } from './ui'

export function ProfitAndLoss({ model }: { model: Model }) {
  const stock = model.snap.stock_pnl
  const options = model.snap.options_book
  return (
    <Section
      index="03"
      title="Profit and loss"
      note="Dollar P&L versus cost is derived from shares, price, and cost. Week-over-week mark-to-market and realized journal P&L are shown only when those fields are present."
    >
      <div className="grid-2">
        <div>
          <p className="group-label">Stock</p>
          <Line label="Realized, journal">
            <Money value={stock?.realized_usd} signed />
          </Line>
          <Line label="Unrealized mark-to-market, week">
            <Money value={stock?.unrealized_mtm_wow_usd} signed />
          </Line>
          <Line label="Unrealized vs cost, derived" strong>
            <Money value={model.unrealized} signed />
          </Line>
          {model.unrealizedPartial ? (
            <p className="fine">Some holdings are missing price or cost, so this sum is partial.</p>
          ) : null}
        </div>
        <div>
          <p className="group-label">Options</p>
          <Line label="Premium income, week">
            <Money value={options?.premium_income_wow} signed />
          </Line>
          <Line label="Premium income, MTD">
            <Money value={options?.premium_income_mtd} signed />
          </Line>
          <Line label="Open short puts">
            {options == null ? (
              <Missing detail="no options book" />
            ) : options.positions == null ? (
              <Missing detail="no positions" />
            ) : (
              <span>{shortPuts(options.positions).length}</span>
            )}
          </Line>
        </div>
      </div>
      <Themes model={model} />
      <Winners model={model} />
    </Section>
  )
}

export function StockPnl({ model }: { model: Model }) {
  return (
    <Section
      index="02"
      title="Stock P&L"
      note="Versus cost, from the holdings file. Theme tags are used when present."
    >
      <Line label="Unrealized vs cost, derived" strong>
        <Money value={model.unrealized} signed />
      </Line>
      <Line label="Realized, journal">
        <Money value={model.snap.stock_pnl?.realized_usd} signed />
      </Line>
      <Line label="Unrealized mark-to-market, week">
        <Money value={model.snap.stock_pnl?.unrealized_mtm_wow_usd} signed />
      </Line>
      <Themes model={model} />
      <Winners model={model} />
    </Section>
  )
}

function Themes({ model }: { model: Model }) {
  return (
    <>
      <p className="group-label">By theme</p>
      {model.themesAllNull ? (
        <p className="note">Every holding has theme set to null. The row below is the whole book, not a classified sleeve.</p>
      ) : null}
      {model.themes.length === 0 ? (
        <p className="missing">Not in snapshot</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Theme</th>
                <th className="num">Names</th>
                <th className="num">Market value</th>
                <th className="num">Vs cost</th>
              </tr>
            </thead>
            <tbody>
              {model.themes.map((theme) => (
                <tr key={theme.theme}>
                  <td>{theme.theme}</td>
                  <td className="num">{theme.count}</td>
                  <td className="num">{formatUsd(theme.mv)}</td>
                  <td className="num">
                    <Money value={theme.pnlUsd} signed />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Winners({ model }: { model: Model }) {
  return (
    <div className="grid-2 winners">
      <RankList title="Winners vs cost" rows={model.winners} empty="No holding is above cost." />
      <RankList title="Losers vs cost" rows={model.losers} empty="No holding is below cost." />
    </div>
  )
}

function RankList({
  title,
  rows,
  empty,
}: {
  title: string
  rows: Model['winners']
  empty: string
}) {
  return (
    <div>
      <p className="group-label">{title}</p>
      {rows.length === 0 ? (
        <p className="missing">{empty}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th className="num">Vs cost</th>
                <th className="num">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ticker}>
                  <td className="ticker">{row.ticker}</td>
                  <td className="num">
                    <Money value={row.pnlUsd} signed />
                  </td>
                  <td className="num">
                    <Pct value={row.pnlPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


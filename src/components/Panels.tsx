import { formatPlainPct, formatUsd } from '../lib/format'
import type { Model } from '../lib/metrics'
import { BalanceSheet } from './BalanceSheet'
import { Benchmarks } from './Benchmarks'
import { CashFlow } from './CashFlow'
import { HoldingsTable } from './HoldingsTable'
import { OptionsBook } from './OptionsBook'
import { ProfitAndLoss, StockPnl } from './Pnl'
import { Risk, StatusCounts } from './Risk'
import { Scorecard } from './Scorecard'
import { Kpi, Missing, Money } from './ui'

export function Consolidated({ model }: { model: Model }) {
  return (
    <div className="stack">
      <Scorecard model={model} />
      <div className="grid-2 align-start">
        <BalanceSheet model={model} />
        <CashFlow model={model} />
      </div>
      <ProfitAndLoss model={model} />
      <Benchmarks model={model} />
      <Risk model={model} />
    </div>
  )
}

export function Stocks({ model }: { model: Model }) {
  const source =
    model.stockMvSource === 'broker_totals'
      ? 'IB + HSBC stock market value'
      : model.stockMvSource === 'holdings'
        ? 'Sum of holding market values'
        : 'Not in snapshot'
  return (
    <div className="stack">
      <section className="card">
        <header className="section-h">
          <span className="idx">Stock</span>
          <h2>Book</h2>
        </header>
        <div className="kpis">
          <Kpi label="Stock market value" value={<Money value={model.stockMv} />} sub={source} />
          <Kpi label="Unrealized vs cost" value={<Money value={model.unrealized} signed />} sub="Derived from holdings" />
          <Kpi
            label="Names"
            value={model.nameCountListed}
            sub={
              model.nameCountStated != null && model.nameCountStated !== model.nameCountListed
                ? `Snapshot count ${model.nameCountStated}`
                : 'Rows in the holdings list'
            }
          />
          <Kpi
            label="Largest name"
            value={model.largest ? model.largest.ticker : <Missing />}
            sub={
              model.largest
                ? `${formatUsd(model.largest.mv)} · ${formatPlainPct(model.largest.weight)} of NAV`
                : 'Needs market value and NAV'
            }
          />
        </div>
        <div className="status-row">
          <StatusCounts model={model} />
        </div>
        <BrokerTie model={model} />
      </section>
      <HoldingsTable model={model} />
      <StockPnl model={model} />
      <Risk model={model} index="03" />
    </div>
  )
}

export function Options({ model }: { model: Model }) {
  return <OptionsBook model={model} />
}

function BrokerTie({ model }: { model: Model }) {
  const { broker } = model
  if (broker.holdingsTieBroker == null) return null
  if (broker.holdingsTieBroker) {
    return <p className="fine">Holdings market value ties to the IB and HSBC stock totals.</p>
  }
  return (
    <p className="fine">
      Holdings do not tie to broker stock totals. IB holdings {formatUsd(broker.holdingsIb)} versus IB market value{' '}
      {broker.ibMv == null ? 'missing' : formatUsd(broker.ibMv)}. HSBC holdings {formatUsd(broker.holdingsHsbc)} versus{' '}
      {broker.hsbcMv == null ? 'missing' : formatUsd(broker.hsbcMv)}.
    </p>
  )
}

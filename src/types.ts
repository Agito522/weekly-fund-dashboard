export type TabId = 'stocks' | 'options' | 'consolidated'

export interface Holding {
  ticker: string
  shares?: number | null
  cost?: number | null
  price?: number | null
  mv?: number | null
  broker?: string | null
  stop?: number | null
  status?: string | null
  theme?: string | null
  pnl_pct?: number | null
}

export interface NavLogRow {
  日期?: string
  '組合價值 (USD)'?: number | null
  '每日變化 (USD)'?: number | null
  '每日變化 %'?: number | null
  收市日?: string
}

export interface BrokerTotals {
  IB_mv?: number | null
  HSBC_mv?: number | null
  IB_cash?: number | null
  HSBC_cash?: number | null
  IB_total?: number | null
  HSBC_total?: number | null
}

export interface BenchmarkWindow {
  window?: {
    start_bar?: string
    end_bar?: string
  }
  harold_pct?: number | null
  benchmarks?: Record<string, number | null>
}

export interface Scorecard {
  overall?: string | null
  dimensions?: Record<string, string>
}

export interface CashFlow {
  stock_sells?: number | null
  stock_buys?: number | null
  dividends?: number | null
  premiums_received?: number | null
  buybacks_paid?: number | null
  assignment_cash?: number | null
  net_vs_prior_week?: number | null
}

export interface StockPnl {
  realized_usd?: number | null
  unrealized_mtm_wow_usd?: number | null
}

export interface OptionPosition {
  ticker?: string | null
  structure?: string | null
  right?: string | null
  strike?: number | null
  expiry?: string | null
  dte?: number | null
  contracts?: number | null
  moneyness?: string | null
  itm?: boolean | null
  premium?: number | null
  assignment_notional?: number | null
}

export interface OptionsBook {
  premium_income_wow?: number | null
  premium_income_mtd?: number | null
  positions?: OptionPosition[] | null
}

export interface Sleeve {
  name: string
  mv?: number | null
}

/**
 * v1 contract is the seeded snapshot. Optional objects are rendered when a
 * later refresh adds them; they are omitted from the 2026-10-09 seed.
 */
export interface WeeklySnapshot {
  as_of_bar?: string
  generated_at_hkt?: string | null
  nav?: number
  cash?: number
  heat_pct?: number
  broker_totals?: BrokerTotals
  nav_log_raw_header?: string[]
  nav_log_rows?: NavLogRow[]
  holdings_count?: number
  holdings?: Holding[]
  benchmark_wow?: BenchmarkWindow
  benchmark_mtd?: BenchmarkWindow | null
  scorecard_seed?: Scorecard
  cash_flow?: CashFlow | null
  stock_pnl?: StockPnl | null
  options_book?: OptionsBook | null
  sleeves?: Sleeve[] | null
}

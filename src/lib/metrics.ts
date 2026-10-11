import type { Holding, OptionPosition, WeeklySnapshot } from '../types'

/** Mandate rules from the weekly report brief. These are not snapshot fields. */
export const HEAT_CAP_PCT = 4
export const CASH_FLOOR_PCT = 1
export const OVERSIZE_RISK_PCT = 0.25
export const EXCESS_TOLERANCE_PP = 0.05

const CLOSE_KEY = '收市日'
const NAV_KEY = '組合價值 (USD)'
const LOG_DATE_KEY = '日期'
const DAILY_USD_KEY = '每日變化 (USD)'
const DAILY_PCT_KEY = '每日變化 %'

const BENCH_ORDER = ['SPY', 'QQQ', 'SOXX', 'CIBR', 'BITO', 'IWM', 'ARKK']
const DIMENSION_ORDER = [
  'mandate',
  'returns_2w',
  'risk_heat',
  'stop_execution',
  'liquidity',
  'concentration',
  'options_risk',
]
const STATUS_ORDER = ['2nd_close_below_stop', 'Trim', 'ema5_below_ema30', 'Hold']

export const DIMENSION_LABELS: Record<string, string> = {
  mandate: 'Mandate',
  returns_2w: 'Returns (2w)',
  risk_heat: 'Risk / heat',
  stop_execution: 'Stop execution',
  liquidity: 'Liquidity',
  concentration: 'Concentration',
  options_risk: 'Options risk',
}

export function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export interface WindowMove {
  startBar: string | null
  endBar: string | null
  startNav: number | null
  endNav: number | null
  deltaUsd: number | null
  recomputedPct: number | null
  statedPct: number | null
  withinTolerance: boolean | null
}

export interface BenchRow {
  symbol: string
  pct: number | null
  excess: number | null
}

export interface Ranked {
  ticker: string
  pnlUsd: number
  pnlPct: number | null
  mv: number | null
}

export interface ThemeRow {
  theme: string
  count: number
  mv: number
  pnlUsd: number | null
}

export interface OversizeRow {
  ticker: string
  broker: string
  riskUsd: number
  riskPct: number
}

export interface BrokerCheck {
  ibMv: number | null
  hsbcMv: number | null
  ibCash: number | null
  hsbcCash: number | null
  ibTotal: number | null
  hsbcTotal: number | null
  holdingsIb: number
  holdingsHsbc: number
  otherBrokers: { broker: string; mv: number }[]
  totalsTieNav: boolean | null
  holdingsTieBroker: boolean | null
}

export interface NavPoint {
  close: string
  nav: number
  logged: string
  dailyUsd: number | null
  dailyPct: number | null
}

export interface ChartPoint {
  name: string
  pct: number
  kind: 'book' | 'bench'
}

export interface StatusCount {
  status: string
  count: number
}

export interface DimensionGrade {
  key: string
  label: string
  grade: string
}

export interface Model {
  snap: WeeklySnapshot
  move: WindowMove
  bookPct: number | null
  bookSource: 'nav_log' | 'stated' | 'missing'
  excessSpy: number | null
  excessQqq: number | null
  benchRows: BenchRow[]
  chart: ChartPoint[]
  cashPercent: number | null
  cashFlag: boolean
  heat: number | null
  heatOverCap: boolean
  unrealized: number | null
  unrealizedPartial: boolean
  winners: Ranked[]
  losers: Ranked[]
  themes: ThemeRow[]
  themesAllNull: boolean
  exits: Holding[]
  oversize: OversizeRow[]
  stopsMissing: number
  broker: BrokerCheck
  navSeries: NavPoint[]
  dailyChangeBlank: boolean
  nameCountStated: number | null
  nameCountListed: number
  stockMv: number | null
  stockMvSource: 'broker_totals' | 'holdings' | 'missing'
  largest: { ticker: string; mv: number; weight: number } | null
  statusCounts: StatusCount[]
  dimensions: DimensionGrade[]
}

function navOnClose(rows: WeeklySnapshot['nav_log_rows'], closeBar: string): number | null {
  for (const row of rows ?? []) {
    if (row[CLOSE_KEY] === closeBar) return finite(row[NAV_KEY])
  }
  return null
}

export function windowMove(snap: WeeklySnapshot): WindowMove {
  const startBar = snap.benchmark_wow?.window?.start_bar ?? null
  const endBar = snap.benchmark_wow?.window?.end_bar ?? null
  const startNav = startBar ? navOnClose(snap.nav_log_rows, startBar) : null
  const endNav = endBar ? navOnClose(snap.nav_log_rows, endBar) : null
  const statedPct = finite(snap.benchmark_wow?.harold_pct)
  const deltaUsd = startNav != null && endNav != null ? endNav - startNav : null
  const recomputedPct =
    startNav != null && endNav != null && startNav !== 0 ? (endNav / startNav - 1) * 100 : null
  const withinTolerance =
    recomputedPct != null && statedPct != null
      ? Math.abs(recomputedPct - statedPct) <= EXCESS_TOLERANCE_PP
      : null
  return { startBar, endBar, startNav, endNav, deltaUsd, recomputedPct, statedPct, withinTolerance }
}

export function unrealizedUsd(holding: Holding): number | null {
  const shares = finite(holding.shares)
  const price = finite(holding.price)
  const cost = finite(holding.cost)
  if (shares == null || price == null || cost == null) return null
  return (price - cost) * shares
}

/** Dollars from the current price down to the stop. Zero once price is through the stop. */
export function riskToStopUsd(holding: Holding): number | null {
  const shares = finite(holding.shares)
  const price = finite(holding.price)
  const stop = finite(holding.stop)
  if (shares == null || price == null || stop == null) return null
  if (!(price > stop)) return 0
  return (price - stop) * shares
}

function orderedKeys(preferred: string[], present: string[]): string[] {
  return [...preferred.filter((key) => present.includes(key)), ...present.filter((key) => !preferred.includes(key))]
}

function benchmarkRows(snap: WeeklySnapshot, bookPct: number | null): BenchRow[] {
  const marks = snap.benchmark_wow?.benchmarks ?? {}
  return orderedKeys(BENCH_ORDER, Object.keys(marks)).map((symbol) => {
    const pct = finite(marks[symbol])
    return {
      symbol,
      pct,
      excess: pct != null && bookPct != null ? bookPct - pct : null,
    }
  })
}

function themeRows(holdings: Holding[]): { rows: ThemeRow[]; allNull: boolean } {
  const allNull = holdings.length > 0 && holdings.every((holding) => !holding.theme)
  const map = new Map<string, { theme: string; count: number; mv: number; pnlUsd: number; pnlKnown: boolean }>()
  for (const holding of holdings) {
    const theme = holding.theme?.trim() ? holding.theme : 'Untagged'
    const current = map.get(theme) ?? { theme, count: 0, mv: 0, pnlUsd: 0, pnlKnown: true }
    current.count += 1
    const mv = finite(holding.mv)
    if (mv != null) current.mv += mv
    const pnl = unrealizedUsd(holding)
    if (pnl == null) current.pnlKnown = false
    else current.pnlUsd += pnl
    map.set(theme, current)
  }
  const rows = [...map.values()]
    .sort((a, b) => b.mv - a.mv)
    .map((row) => ({
      theme: row.theme,
      count: row.count,
      mv: row.mv,
      pnlUsd: row.pnlKnown ? row.pnlUsd : null,
    }))
  return { rows, allNull }
}

function ranked(holdings: Holding[]): { winners: Ranked[]; losers: Ranked[] } {
  const rows: Ranked[] = []
  for (const holding of holdings) {
    const pnlUsd = unrealizedUsd(holding)
    if (pnlUsd == null) continue
    rows.push({
      ticker: holding.ticker,
      pnlUsd,
      pnlPct: finite(holding.pnl_pct),
      mv: finite(holding.mv),
    })
  }
  return {
    winners: rows.filter((row) => row.pnlUsd > 0).sort((a, b) => b.pnlUsd - a.pnlUsd).slice(0, 5),
    losers: rows.filter((row) => row.pnlUsd < 0).sort((a, b) => a.pnlUsd - b.pnlUsd).slice(0, 5),
  }
}

function brokerCheck(snap: WeeklySnapshot): BrokerCheck {
  const totals = snap.broker_totals
  const ibMv = finite(totals?.IB_mv)
  const hsbcMv = finite(totals?.HSBC_mv)
  const ibCash = finite(totals?.IB_cash)
  const hsbcCash = finite(totals?.HSBC_cash)
  const ibTotal = finite(totals?.IB_total)
  const hsbcTotal = finite(totals?.HSBC_total)
  const byBroker = new Map<string, number>()
  for (const holding of snap.holdings ?? []) {
    const mv = finite(holding.mv)
    if (mv == null) continue
    const key = holding.broker?.trim() ? holding.broker : 'Unknown'
    byBroker.set(key, (byBroker.get(key) ?? 0) + mv)
  }
  const holdingsIb = byBroker.get('IB') ?? 0
  const holdingsHsbc = byBroker.get('HSBC') ?? 0
  const otherBrokers = [...byBroker.entries()]
    .filter(([broker]) => broker !== 'IB' && broker !== 'HSBC')
    .map(([broker, mv]) => ({ broker, mv }))
  const nav = finite(snap.nav)
  const totalsTieNav =
    ibTotal != null && hsbcTotal != null && nav != null ? Math.abs(ibTotal + hsbcTotal - nav) < 0.05 : null
  const holdingsTieBroker =
    ibMv != null && hsbcMv != null
      ? Math.abs(holdingsIb - ibMv) < 1 && Math.abs(holdingsHsbc - hsbcMv) < 1 && otherBrokers.length === 0
      : null
  return {
    ibMv,
    hsbcMv,
    ibCash,
    hsbcCash,
    ibTotal,
    hsbcTotal,
    holdingsIb,
    holdingsHsbc,
    otherBrokers,
    totalsTieNav,
    holdingsTieBroker,
  }
}

export function shortPuts(positions: OptionPosition[]): OptionPosition[] {
  return positions.filter(
    (position) =>
      position.structure === 'short_put' ||
      position.structure === 'csp' ||
      (position.right === 'P' && position.structure !== 'covered_call'),
  )
}

export function coveredCalls(positions: OptionPosition[]): OptionPosition[] {
  return positions.filter(
    (position) => position.structure === 'covered_call' || position.structure === 'cc',
  )
}

export function nearTermOptions(positions: OptionPosition[]): OptionPosition[] {
  return positions.filter((position) => {
    const dte = finite(position.dte)
    const nearAtm = typeof position.moneyness === 'string' && /atm|near/i.test(position.moneyness)
    return position.itm === true || (dte != null && dte <= 7) || nearAtm
  })
}

export function assignmentTotal(positions: OptionPosition[]): number | null {
  let sum = 0
  let any = false
  for (const position of positions) {
    const notional = finite(position.assignment_notional)
    if (notional == null) continue
    any = true
    sum += notional
  }
  return any ? sum : null
}

export function buildModel(snap: WeeklySnapshot): Model {
  const move = windowMove(snap)
  const bookPct = move.recomputedPct ?? move.statedPct
  const bookSource: Model['bookSource'] =
    move.recomputedPct != null ? 'nav_log' : move.statedPct != null ? 'stated' : 'missing'
  const benchRows = benchmarkRows(snap, bookPct)
  const chart: ChartPoint[] = []
  if (bookPct != null) chart.push({ name: 'Book', pct: bookPct, kind: 'book' })
  for (const row of benchRows) {
    if (row.pct != null) chart.push({ name: row.symbol, pct: row.pct, kind: 'bench' })
  }

  const nav = finite(snap.nav)
  const cash = finite(snap.cash)
  const cashPercent = cash != null && nav != null && nav !== 0 ? (cash / nav) * 100 : null
  const heat = finite(snap.heat_pct)
  const holdings = snap.holdings ?? []

  let unrealized = 0
  let unrealizedCount = 0
  for (const holding of holdings) {
    const pnl = unrealizedUsd(holding)
    if (pnl == null) continue
    unrealized += pnl
    unrealizedCount += 1
  }
  const unrealizedPartial = unrealizedCount > 0 && unrealizedCount < holdings.length

  const oversize: OversizeRow[] = []
  let stopsMissing = 0
  for (const holding of holdings) {
    if (holding.stop == null) {
      stopsMissing += 1
      continue
    }
    const riskUsd = riskToStopUsd(holding)
    if (riskUsd == null || nav == null || nav === 0) continue
    const riskPct = (riskUsd / nav) * 100
    if (riskPct > OVERSIZE_RISK_PCT) {
      oversize.push({
        ticker: holding.ticker,
        broker: holding.broker ?? '—',
        riskUsd,
        riskPct,
      })
    }
  }
  oversize.sort((a, b) => b.riskPct - a.riskPct)

  const broker = brokerCheck(snap)
  const stockMv =
    broker.ibMv != null && broker.hsbcMv != null ? broker.ibMv + broker.hsbcMv : null
  const holdingsMv = holdings.reduce((sum, holding) => sum + (finite(holding.mv) ?? 0), 0)
  let stockMvValue: number | null = stockMv
  let stockMvSource: Model['stockMvSource'] = stockMv != null ? 'broker_totals' : 'missing'
  if (stockMvValue == null && holdings.some((holding) => finite(holding.mv) != null)) {
    stockMvValue = holdingsMv
    stockMvSource = 'holdings'
  }

  let largest: Model['largest'] = null
  for (const holding of holdings) {
    const mv = finite(holding.mv)
    if (mv == null || nav == null || nav === 0) continue
    if (!largest || mv > largest.mv) largest = { ticker: holding.ticker, mv, weight: (mv / nav) * 100 }
  }

  const navSeries: NavPoint[] = []
  for (const row of snap.nav_log_rows ?? []) {
    const close = row[CLOSE_KEY]
    const level = finite(row[NAV_KEY])
    if (!close || level == null) continue
    navSeries.push({
      close,
      nav: level,
      logged: row[LOG_DATE_KEY] ?? '',
      dailyUsd: finite(row[DAILY_USD_KEY]),
      dailyPct: finite(row[DAILY_PCT_KEY]),
    })
  }
  navSeries.sort((a, b) => a.close.localeCompare(b.close))
  const dailyChangeBlank =
    (snap.nav_log_rows?.length ?? 0) > 0 &&
    (snap.nav_log_rows ?? []).every((row) => row[DAILY_USD_KEY] == null && row[DAILY_PCT_KEY] == null)

  const statusMap = new Map<string, number>()
  for (const holding of holdings) {
    const status = holding.status?.trim() ? holding.status : 'Unknown'
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
  }
  const statusCounts = orderedKeys(STATUS_ORDER, [...statusMap.keys()]).map((status) => ({
    status,
    count: statusMap.get(status) ?? 0,
  }))

  const dimensionsRaw = snap.scorecard_seed?.dimensions ?? {}
  const dimensions = orderedKeys(DIMENSION_ORDER, Object.keys(dimensionsRaw)).map((key) => ({
    key,
    label: DIMENSION_LABELS[key] ?? key,
    grade: dimensionsRaw[key] ?? '—',
  }))

  const spy = benchRows.find((row) => row.symbol === 'SPY')
  const qqq = benchRows.find((row) => row.symbol === 'QQQ')
  const { winners, losers } = ranked(holdings)
  const themes = themeRows(holdings)

  return {
    snap,
    move,
    bookPct,
    bookSource,
    excessSpy: spy?.excess ?? null,
    excessQqq: qqq?.excess ?? null,
    benchRows,
    chart,
    cashPercent,
    cashFlag: cashPercent != null && cashPercent < CASH_FLOOR_PCT,
    heat,
    heatOverCap: heat != null && heat > HEAT_CAP_PCT,
    unrealized: unrealizedCount > 0 ? unrealized : null,
    unrealizedPartial,
    winners,
    losers,
    themes: themes.rows,
    themesAllNull: themes.allNull,
    exits: holdings
      .filter((holding) => holding.status === '2nd_close_below_stop')
      .sort((a, b) => (finite(b.mv) ?? 0) - (finite(a.mv) ?? 0)),
    oversize,
    stopsMissing,
    broker,
    navSeries,
    dailyChangeBlank,
    nameCountStated: finite(snap.holdings_count),
    nameCountListed: holdings.length,
    stockMv: stockMvValue,
    stockMvSource,
    largest,
    statusCounts,
    dimensions,
  }
}

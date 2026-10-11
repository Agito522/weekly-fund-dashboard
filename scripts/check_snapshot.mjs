import { readFileSync } from 'node:fs'

const snap = JSON.parse(readFileSync(new URL('../public/data/weekly_snapshot.json', import.meta.url), 'utf8'))

const required = [
  'as_of_bar',
  'nav',
  'cash',
  'heat_pct',
  'broker_totals',
  'nav_log_rows',
  'holdings',
  'holdings_count',
  'benchmark_wow',
  'scorecard_seed',
]

const missing = required.filter((key) => snap[key] == null)
if (missing.length > 0) {
  console.error(`missing keys: ${missing.join(', ')}`)
  process.exit(1)
}

const startBar = snap.benchmark_wow.window?.start_bar
const endBar = snap.benchmark_wow.window?.end_bar
const start = snap.nav_log_rows.find((row) => row['收市日'] === startBar)
const end = snap.nav_log_rows.find((row) => row['收市日'] === endBar)
if (!start || !end) {
  console.error('NAV log is missing a close date from benchmark_wow.window')
  process.exit(1)
}

const startNav = start['組合價值 (USD)']
const endNav = end['組合價值 (USD)']
const recomputed = (endNav / startNav - 1) * 100
const stated = snap.benchmark_wow.harold_pct
const diff = Math.abs(recomputed - stated)

console.log(`as_of_bar=${snap.as_of_bar}`)
console.log(`book_recomputed_pct=${recomputed.toFixed(4)}`)
console.log(`stated_harold_pct=${stated}`)
console.log(`abs_diff_pp=${diff.toFixed(4)}`)

for (const symbol of ['SPY', 'QQQ']) {
  const bench = snap.benchmark_wow.benchmarks?.[symbol]
  if (typeof bench !== 'number') {
    console.error(`benchmark ${symbol} is missing`)
    process.exit(1)
  }
  console.log(`excess_${symbol}_pp=${(recomputed - bench).toFixed(4)}`)
}

if (diff > 0.05) {
  console.error('NAV-log return and harold_pct differ by more than 0.05 pp')
  process.exit(1)
}

if (snap.holdings_count !== snap.holdings.length) {
  console.error(`holdings_count ${snap.holdings_count} != holdings length ${snap.holdings.length}`)
  process.exit(1)
}

console.log('ok')

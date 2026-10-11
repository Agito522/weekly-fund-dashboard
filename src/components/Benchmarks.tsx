import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { asNumber, formatIsoDate, formatPct, formatPlainPct, formatUsd } from '../lib/format'
import type { Model } from '../lib/metrics'
import { Missing, Pct, Pp, Section } from './ui'

export function Benchmarks({ model }: { model: Model }) {
  const mtd = model.snap.benchmark_mtd
  const leader = [...model.benchRows]
    .filter((row) => row.pct != null)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0]

  return (
    <Section
      index="04"
      title="Benchmarks"
      note="One window, from benchmark_wow. The book bar is the NAV-log return when both closes are in the log. Bars are period returns, not a daily path."
    >
      <h3 className="chart-title">NAV vs benchmarks</h3>
      {model.chart.length === 0 ? (
        <Missing detail="no returns to chart" />
      ) : (
        <div className="chart" role="img" aria-label="Window return of the book versus benchmarks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={model.chart} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(231,225,214,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a39b90', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                tick={{ fill: '#a39b90', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <ReferenceLine y={0} stroke="rgba(231,225,214,0.35)" />
              <Tooltip
                cursor={{ fill: 'rgba(215,185,138,0.06)' }}
                contentStyle={tipStyle}
                labelStyle={{ color: '#ebe6dc' }}
                formatter={(value) => {
                  const n = asNumber(value)
                  return n == null ? '—' : formatPct(n)
                }}
              />
              <Bar dataKey="pct" isAnimationActive={false} radius={[3, 3, 0, 0]}>
                {model.chart.map((point) => (
                  <Cell key={point.name} fill={barFill(point.kind, point.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Series</th>
              <th className="num">Window</th>
              <th className="num">Excess vs book</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ticker">Book</td>
              <td className="num">
                <Pct value={model.bookPct} />
              </td>
              <td className="num">—</td>
            </tr>
            {model.benchRows.map((row) => (
              <tr key={row.symbol}>
                <td className="ticker">{row.symbol}</td>
                <td className="num">
                  <Pct value={row.pct} />
                </td>
                <td className="num">
                  <Pp value={row.excess} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leader && leader.pct != null && model.bookPct != null ? (
        <p className="note callout">{leaderCallout(leader.symbol, leader.pct, model.bookPct)}</p>
      ) : null}

      <h3 className="chart-title">NAV log</h3>
      {model.dailyChangeBlank ? (
        <p className="note">Daily change columns are null on every row. Levels are plotted from 組合價值.</p>
      ) : null}
      {model.navSeries.length === 0 ? (
        <Missing detail="nav log" />
      ) : (
        <div className="chart" role="img" aria-label="NAV log by US close date">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={model.navSeries} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(231,225,214,0.08)" vertical={false} />
              <XAxis
                dataKey="close"
                tickFormatter={(value: string) => value.slice(5)}
                tick={{ fill: '#a39b90', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
                tick={{ fill: '#a39b90', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={tipStyle}
                labelFormatter={(label) => formatIsoDate(String(label), 'short')}
                formatter={(value) => {
                  const n = asNumber(value)
                  return n == null ? '—' : formatUsd(n)
                }}
              />
              <Line
                type="monotone"
                dataKey="nav"
                name="NAV"
                stroke="#d7b98a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#d7b98a' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {model.navSeries.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Close</th>
                <th>Logged</th>
                <th className="num">NAV</th>
                <th className="num">Daily $</th>
                <th className="num">Daily %</th>
              </tr>
            </thead>
            <tbody>
              {model.navSeries.map((point) => (
                <tr key={point.close}>
                  <td>{point.close}</td>
                  <td>{point.logged || '—'}</td>
                  <td className="num">{formatUsd(point.nav)}</td>
                  <td className="num">{point.dailyUsd == null ? '—' : formatUsd(point.dailyUsd)}</td>
                  <td className="num">{point.dailyPct == null ? '—' : formatPlainPct(point.dailyPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <h3 className="chart-title">Month to date</h3>
      {mtd?.benchmarks ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Series</th>
                <th className="num">MTD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ticker">Book</td>
                <td className="num">
                  <Pct value={mtd.harold_pct} />
                </td>
              </tr>
              {Object.entries(mtd.benchmarks).map(([symbol, pct]) => (
                <tr key={symbol}>
                  <td className="ticker">{symbol}</td>
                  <td className="num">
                    <Pct value={pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="missing">MTD benchmark window is not in this snapshot.</p>
      )}
    </Section>
  )
}

const tipStyle = {
  background: '#14181f',
  border: '1px solid rgba(231,225,214,0.16)',
  borderRadius: 8,
  color: '#ebe6dc',
}

function barFill(kind: 'book' | 'bench', pct: number): string {
  if (kind === 'book') return '#d7b98a'
  return pct >= 0 ? '#7fa898' : '#c48484'
}

function leaderCallout(symbol: string, leaderPct: number, bookPct: number): string {
  const gap = Math.abs(bookPct - leaderPct).toFixed(2)
  const relation = bookPct >= leaderPct ? `leads it by ${gap} pp` : `trails it by ${gap} pp`
  return `${symbol} is the strongest benchmark in this file at ${formatPct(leaderPct)}. The book ${relation}. Sleeve weights are not in the snapshot, so this is not an opportunity-cost estimate.`
}

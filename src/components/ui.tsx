import type { ReactNode } from 'react'
import { formatPct, formatPlainPct, formatPp, formatSignedUsd, formatUsd, toneClass } from '../lib/format'

export function Missing({ detail }: { detail?: string }) {
  return <span className="missing">{detail ? `Not in snapshot · ${detail}` : 'Not in snapshot'}</span>
}

export function Money({
  value,
  signed = false,
}: {
  value: number | null | undefined
  signed?: boolean
}) {
  if (value == null || Number.isNaN(value)) return <Missing />
  return <span className={toneClass(signed ? value : value < 0 ? value : null)}>{signed ? formatSignedUsd(value) : formatUsd(value)}</span>
}

export function Pct({ value, plain = false }: { value: number | null | undefined; plain?: boolean }) {
  if (value == null || Number.isNaN(value)) return <Missing />
  return <span className={plain ? undefined : toneClass(value)}>{plain ? formatPlainPct(value) : formatPct(value)}</span>
}

export function Pp({ value }: { value: number | null | undefined }) {
  if (value == null || Number.isNaN(value)) return <Missing />
  return <span className={toneClass(value)}>{formatPp(value)}</span>
}

export function Section({
  index,
  title,
  note,
  children,
}: {
  index: string
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="card">
      <header className="section-h">
        <span className="idx">{index}</span>
        <h2>{title}</h2>
      </header>
      {note ? <p className="note">{note}</p> : null}
      {children}
    </section>
  )
}

export function Line({
  label,
  children,
  strong = false,
}: {
  label: string
  children: ReactNode
  strong?: boolean
}) {
  return (
    <div className={strong ? 'line strong' : 'line'}>
      <span>{label}</span>
      <span className="line-value">{children}</span>
    </div>
  )
}

export function Kpi({
  label,
  value,
  sub,
  flag = false,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  flag?: boolean
}) {
  return (
    <div className={flag ? 'kpi flag' : 'kpi'}>
      <span className="label">{label}</span>
      <div className="value">{value}</div>
      {sub ? <span className="sub">{sub}</span> : null}
    </div>
  )
}

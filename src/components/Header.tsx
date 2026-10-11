import type { TabId } from '../types'
import { formatIsoDate } from '../lib/format'
import type { Model } from '../lib/metrics'

const TABS: { id: TabId; label: string }[] = [
  { id: 'stocks', label: 'Stocks' },
  { id: 'options', label: 'Options' },
  { id: 'consolidated', label: 'Consolidated' },
]

export function Header({ model, tab }: { model: Model; tab: TabId }) {
  const bar = model.snap.as_of_bar
  const run = model.snap.generated_at_hkt
  const { startBar, endBar } = model.move

  return (
    <header className="mast-wrap">
      <div className="mast">
        <div>
          <p className="kicker">Equity book · read only</p>
          <h1>Harold</h1>
          <p className="subtitle">Weekly fund report</p>
        </div>
        <div className="asof">
          <p className="kicker">Snapshot</p>
          <p className="asof-date">{bar ? formatIsoDate(bar) : 'Date missing'}</p>
          <p className="asof-bar">{bar ? `Bar ${bar}` : 'Bar date not in snapshot'}</p>
          <p className="asof-run">{run ? `HKT ${run}` : 'HKT run time not in snapshot'}</p>
        </div>
      </div>
      {startBar && endBar ? (
        <p className="window-line">
          Performance window · {formatIsoDate(startBar, 'short')} close → {formatIsoDate(endBar, 'short')} close
        </p>
      ) : (
        <p className="window-line">Performance window not in snapshot</p>
      )}
      <nav className="tabs" role="tablist" aria-label="Book">
        {TABS.map((item) => (
          <a
            key={item.id}
            id={`tab-${item.id}`}
            href={`#${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Consolidated, Options, Stocks } from './components/Panels'
import { buildModel, type Model } from './lib/metrics'
import type { TabId, WeeklySnapshot } from './types'

function tabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'stocks' || hash === 'options' || hash === 'consolidated') return hash
  return 'consolidated'
}

async function loadSnapshot(): Promise<WeeklySnapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/weekly_snapshot.json`)
  if (!response.ok) throw new Error(`Snapshot request failed (${response.status}).`)
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Snapshot JSON is not an object.')
  }
  return data as WeeklySnapshot
}

export default function App() {
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [model, setModel] = useState<Model | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setTab(tabFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadSnapshot()
      .then((snapshot) => {
        if (!cancelled) setModel(buildModel(snapshot))
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the snapshot.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="letterhead" />
      {!model && !error ? <p className="loading">Loading snapshot…</p> : null}
      {error ? (
        <section className="card">
          <h1>Snapshot unavailable</h1>
          <p>{error}</p>
          <p className="note">Expected file: public/data/weekly_snapshot.json</p>
        </section>
      ) : null}
      {model ? (
        <>
          <Header model={model} tab={tab} />
          {model.cashFlag ? <p className="banner">Cash is below 1% of NAV.</p> : null}
          {model.heatOverCap ? <p className="banner">Heat is above the 4% cap.</p> : null}
          {model.move.withinTolerance === false ? (
            <p className="banner warn">
              Stated book return and the NAV-log return differ by more than 0.05 percentage points. Excess uses the log.
            </p>
          ) : null}
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'stocks' ? <Stocks model={model} /> : null}
            {tab === 'options' ? <Options model={model} /> : null}
            {tab === 'consolidated' ? <Consolidated model={model} /> : null}
          </div>
          <footer className="footer">
            Harold weekly fund report · public/data/weekly_snapshot.json · read only · blank cells are fields the
            snapshot does not contain
          </footer>
        </>
      ) : null}
    </div>
  )
}

# Harold weekly fund report

Read-only week-in-review for the equity book: balance sheet, cash flow, stock and option P&L, and NAV versus benchmarks. The page is driven by one static snapshot. Missing fields stay blank. The app does not invent numbers.

Seeded week: **bar 2026-10-09**.

## Open it

Local:

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/weekly-fund-dashboard/](http://localhost:5173/weekly-fund-dashboard/). The Vite `base` is `/weekly-fund-dashboard/` so the dev server matches GitHub project Pages.

Production: [https://agito522.github.io/weekly-fund-dashboard/](https://agito522.github.io/weekly-fund-dashboard/)

Tabs: **Stocks**, **Options**, **Consolidated**. Consolidated is the default letter. Hash links work: `#stocks`, `#options`, `#consolidated`.

## Refresh the week

1. Replace [`public/data/weekly_snapshot.json`](public/data/weekly_snapshot.json) with the new week. Keep the v1 keys in [docs/schema.md](docs/schema.md). Optional objects (`cash_flow`, `options_book`, `sleeves`, `stock_pnl`, `benchmark_mtd`, `generated_at_hkt`) are rendered when present and left as “Not in snapshot” when absent.
2. Check the file:

```bash
npm run check
```

That recomputes the window return from the NAV log (`收市日` start → end) and fails if it differs from `benchmark_wow.harold_pct` by more than 0.05 percentage points.

3. Reload the browser. No rebuild is required for `npm run dev`. A Pages deploy needs a push to `main`.

`scripts/refresh_snapshot.py` is a stub for a later Drive + yfinance job. It does not read or write anything. Running it with `--fetch` or `--write` exits with an error so it cannot pretend to refresh.

## Deploy

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml): check, lint, build, and deploy with GitHub Pages actions. The site source must be **GitHub Actions** (Settings → Pages → Build and deployment).

Pull requests run check, lint, and build only.

## What the page derives

These are computed from fields that are already in the file, and labeled as derived:

- Window change in dollars, and the book return, from NAV-log closes matching `benchmark_wow.window`
- Excess versus each benchmark: log return minus that benchmark’s window return
- Cash as a percent of NAV, flagged under the 1% floor
- Unrealized stock P&L versus cost
- Risk to stop, flagged above 0.25% of NAV
- Exit list: holdings with status `2nd_close_below_stop`

Heat is shown as stored (`heat_pct` of `3.6923` is 3.69%) against a 4% cap. Grades are the snapshot’s `scorecard_seed`. They are not recomputed.

## Open questions

1. The 2026-10-09 seed has no options book, cash-flow lines, sleeve tags, or holding themes. Should the next file add the optional objects in `docs/schema.md`?
2. This repo is public, so the Pages URL is public. Should a later week move to a private host?
3. The exit list treats status `2nd_close_below_stop` as the signal. Confirm that this is the 50-day average exit named in the brief, or a separate stop.

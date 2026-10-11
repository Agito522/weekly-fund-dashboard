# Weekly snapshot schema (v1)

File: `public/data/weekly_snapshot.json`

The seeded file is the handoff snapshot for bar date `2026-10-09`. The app reads this shape. It does not fill gaps. A null cell is shown as a dash. A missing key is shown as “Not in snapshot”.

## Required top-level keys

| Key | Type | Meaning |
| --- | --- | --- |
| `as_of_bar` | string `YYYY-MM-DD` | US close the report is about. Shown as the snapshot date. |
| `nav` | number | Equity-book NAV in USD. |
| `cash` | number | Book cash in USD. |
| `heat_pct` | number | Heat in percent units. `3.6923` means 3.6923%, compared with a 4% cap in the UI. |
| `broker_totals` | object | Broker market values, cash, and totals. See below. |
| `nav_log_raw_header` | string[] | Source header row. Preserved; the UI uses the known column names. |
| `nav_log_rows` | object[] | NAV log. See below. |
| `holdings_count` | number | Name count as stored. The UI also counts `holdings`. |
| `holdings` | object[] | Stock positions. See below. |
| `benchmark_wow` | object | One performance window plus benchmark returns. |
| `scorecard_seed` | object | Letter grades. Display only; the app does not recompute them. |

### `broker_totals`

| Key | Meaning |
| --- | --- |
| `IB_mv` | Interactive Brokers stock market value |
| `HSBC_mv` | HSBC stock market value |
| `IB_cash` | IB cash |
| `HSBC_cash` | HSBC cash. `0` is a real zero, not a missing value. |
| `IB_total` | IB market value plus IB cash |
| `HSBC_total` | HSBC market value plus HSBC cash |

### NAV log row

Keys are the source workbook headers:

| Key | Meaning |
| --- | --- |
| `日期` | Date the row was logged |
| `組合價值 (USD)` | NAV |
| `每日變化 (USD)` | Daily change in dollars. Null in the seed. |
| `每日變化 %` | Daily change in percent. Null in the seed. |
| `收市日` | US session close that the NAV refers to |

`benchmark_wow.window.start_bar` and `end_bar` match `收市日`, not `日期`.

Window return used for excess:

```text
book_pct = (end NAV / start NAV - 1) * 100
excess   = book_pct - benchmark_pct
```

`npm run check` fails when `abs(book_pct - harold_pct) > 0.05`.

### `benchmark_wow`

```json
{
  "window": { "start_bar": "2026-09-29", "end_bar": "2026-10-09" },
  "harold_pct": 4.27,
  "benchmarks": { "SPY": 1.88, "QQQ": 1.81 }
}
```

`harold_pct` and each benchmark value are percent units (`1.88` means +1.88%). The seed includes SPY, QQQ, IWM, SOXX, BITO, ARKK, and CIBR. Extra symbols are shown as stored.

### Holding

| Key | Meaning |
| --- | --- |
| `ticker` | Symbol |
| `shares` | Quantity |
| `cost` | Average cost per share |
| `price` | Mark |
| `mv` | Market value |
| `broker` | `IB` or `HSBC` in the seed |
| `stop` | Stop price |
| `status` | `Hold`, `Trim`, `ema5_below_ema30`, or `2nd_close_below_stop` |
| `theme` | Sleeve or theme tag. Null on every seed row. |
| `pnl_pct` | Percent versus cost, as stored (`-0.44` means -0.44%). |

Exit list: `status === "2nd_close_below_stop"`.

Risk to stop, only while price is above the stop: `(price - stop) * shares / nav`. The UI flags names above 0.25% of NAV.

### `scorecard_seed`

```json
{
  "overall": "B-",
  "dimensions": {
    "mandate": "A-",
    "returns_2w": "B",
    "risk_heat": "B",
    "stop_execution": "D+",
    "liquidity": "D",
    "concentration": "C",
    "options_risk": "C-"
  }
}
```

Unknown dimension keys are still shown.

## Optional keys

Omitted from the 2026-10-09 seed. Add them on a later refresh and the page will fill the matching section.

### `generated_at_hkt`

String. Shown next to the bar date as the HKT run time.

### `cash_flow`

Signed USD, as stored. The UI does not flip signs.

| Key | Line |
| --- | --- |
| `stock_sells` | Stock sells |
| `stock_buys` | Stock buys |
| `dividends` | Dividends |
| `premiums_received` | Option premiums received |
| `buybacks_paid` | Option buybacks paid |
| `assignment_cash` | Assignment cash |
| `net_vs_prior_week` | Net cash change versus the prior week |

### `stock_pnl`

| Key | Line |
| --- | --- |
| `realized_usd` | Realized P&L from the journal |
| `unrealized_mtm_wow_usd` | Unrealized mark-to-market for the week |

Versus-cost P&L is always derived from holdings and is not this object.

### `options_book`

| Key | Meaning |
| --- | --- |
| `premium_income_wow` | Premium income for the week |
| `premium_income_mtd` | Premium income month to date |
| `positions` | Array of option rows |

Position fields: `ticker`, `structure`, `right`, `strike`, `expiry`, `dte`, `contracts`, `moneyness`, `itm`, `premium`, `assignment_notional`.

`structure` values the UI understands:

| Value | Section |
| --- | --- |
| `short_put` or `csp` | Open short puts |
| `covered_call` or `cc` | Covered calls |
| `right: "P"` and not a covered call | Open short puts |

Near-term risk lists a position when `dte` is 7 or less, `itm` is true, or `moneyness` contains “ATM” or “near”. The app does not infer moneyness from the stock price.

### `sleeves`

Array of `{ "name": "Core TML", "mv": 0 }`. When the key is absent, Core TML, Non-core, and Levered ETF render as blank lines.

### `benchmark_mtd`

Same shape as `benchmark_wow`. Rendered as the month-to-date table. The UI does not invent an MTD window from the NAV log.

## UI rules that are not data

- Heat cap: 4% of NAV
- Cash flag: cash under 1% of NAV
- Oversize: more than 0.25% of NAV from price down to stop

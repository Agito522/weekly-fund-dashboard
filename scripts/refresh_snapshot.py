#!/usr/bin/env python3
"""Stub for a future Drive + yfinance refresh.

v1 does not fetch anything and does not modify the snapshot.
Replace public/data/weekly_snapshot.json by hand, or extend this script later.

Intended inputs (not read yet):
  Drive Grok_US_Portfolio.xlsx, id 1hahbgjsPDwpwZCrNiqZfvoz9g3xlqKnz
  Drive Portfolio_NAV_Log.xlsx, id 1zssViZ3o_ey_zQzi8e8bmh3YjoOplczG
  Yahoo symbols SPY, QQQ, IWM, SOXX, BITO, ARKK, CIBR

Schema: docs/schema.md
"""

from __future__ import annotations

import sys


def main() -> int:
    print("refresh_snapshot is a stub. No files were read or written.")
    print("Refresh v1 by replacing public/data/weekly_snapshot.json.")
    print("Schema: docs/schema.md")
    if "--fetch" in sys.argv or "--write" in sys.argv:
        print("Drive and yfinance refresh is not implemented.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

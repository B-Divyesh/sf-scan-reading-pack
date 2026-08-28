# Demo sandbox

Open **`/demo/`** (or `/?demo=1`) to enter the Scan Reading Pack demo.

The sample is a one-page, authored scan called “The Night Reading Room.” It
includes five pre-recognized lines, one deliberately low-confidence line, and
source coordinates so a visitor can immediately try the trace and export flow.

Demo documents are stored only in the IndexedDB database
`demo:scan-reading-pack`. Personal projects use the separate
`scan-reading-pack` database. Demo mode does not read the personal library or
license localStorage values. **Reset demo** deletes and recreates the sample;
**Start for real** discards the demo database and opens the empty personal
library.

The demo is covered by the exact browser tests listed in
[`claims.json`](claims.json), including offline reload after the first visit.

# Copy audit

Audited 5 September 2026. This inventory covers every visible string on the
personal and demo landing pages, including empty, saved, licensed, revoked,
offline, import, restore, and demo states. Template values count as one word.
All entries are at most 22 words. None uses a banned marketing word or a
workshop, workbench, bench, shelf, or chapter metaphor.

## Shared header and first screen

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Skip link | Skip to main content | 4 | Pass |
| Wordmark | Scan Reading Pack | 3 | Pass |
| Navigation | How it works | 3 | Pass |
| Navigation | Demo | 1 | Pass |
| Navigation | Privacy | 1 | Pass |
| Online state | Stored here | 2 | Pass |
| Offline state | Offline | 1 | Pass |
| Section label | Local scan-to-text tool | 3 | Pass |
| H1 | Make reading packs from scanned pages | 6 | Pass |
| Audience sentence | For readers with scanned books or reports who need selectable text linked to its source page. | 16 | Pass |
| Primary action | Try it with sample data | 5 | Pass |
| Primary-action note | Opens a marked one-page reading pack | 6 | Pass |
| Import action | Choose your scans | 3 | Pass |
| Import formats | PDF, PNG, JPEG or WebP | 5 | Pass |
| Fact | Sample data uses its own workspace. | 6 | Pass |
| Fact | Pages stay in this browser. | 5 | Pass |
| Fact | Cached OCR works offline. | 4 | Pass |
| Copyright reminder | Only process material you have the right to use. | 9 | Pass |
| Illustration label | Source page | 2 | Pass |
| Illustration label | Reading pack | 2 | Pass |

## Saved-reading-pack section

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Section label | Saved reading packs | 3 | Pass |
| H2 | Continue a reading pack | 4 | Pass |
| Saved-state action | Export project data | 3 | Pass |
| Saved-project status template | `{count} pages · {count} recognized` | 5 | Pass |
| Empty-state H3 | No scans saved | 3 | Pass |
| Empty-state sentence | Choose a scan above. | 4 | Pass |
| Empty-state sentence | Its pages, recognition, and corrections will reappear here after a refresh. | 11 | Pass |
| Restore action | Import project backup | 3 | Pass |

## How it works

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Section label | Reading pack steps | 3 | Pass |
| H2 | Make a reading pack in four steps | 7 | Pass |
| Step H3 | Recognize locally | 2 | Pass |
| Step sentence | English OCR runs in your browser. | 6 | Pass |
| Step sentence | The first use caches language files for later offline work. | 10 | Pass |
| Step H3 | Show each line on its source page | 7 | Pass |
| Step sentence | Select any line to reveal its source page and exact region. | 11 | Pass |
| Step sentence | Extract figures with a crop gesture. | 6 | Pass |
| Step H3 | Review low-confidence lines | 3 | Pass |
| Step sentence | Low-confidence lines form a short correction queue. | 7 | Pass |
| Step sentence | Changed lines keep their original confidence. | 6 | Pass |
| Step H3 | Export the reading pack | 4 | Pass |
| Step sentence | Export Markdown, HTML, figures, coordinates, plain text, and optional SSML in one ZIP. | 13 | Pass |

## Free and paid states

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Section label | Paid license | 2 | Pass |
| H2 | Free core tools and a one-time license | 7 | Pass |
| Pricing sentence | Every project can be corrected, backed up, and exported. | 9 | Pass |
| Pricing sentence | A one-time $19 USD license adds unlimited-page OCR and audiobook SSML export on your devices. | 15 | Pass |
| Buy action | Buy the $19 one-time license | 5 | Pass |
| Purchase sentence | One-time purchase. | 2 | Pass |
| Merchant sentence | Sociobot/Dodo is merchant of record; refunds are handled there. | 9 | Pass |
| License label | Paste a license from another device | 6 | Pass |
| License placeholder | License token | 2 | Pass |
| License action | Verify license | 2 | Pass |
| Legal link | Privacy | 1 | Pass |
| Legal link | Terms | 1 | Pass |
| Licensed state | Paid features active | 3 | Pass |
| Licensed sentence | Your cached license is active. | 5 | Pass |
| Licensed sentence | It is rechecked at most once a day. | 8 | Pass |
| License action | Remove license from this device | 5 | Pass |
| Revoked sentence | This license is no longer active because billing reported it as revoked. | 12 | Pass |

## Demo landing variant

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Section label | Sample reading pack | 3 | Pass |
| H2 | Try the sample, then import your scans | 7 | Pass |
| Demo sentence | This demo contains one preloaded page. | 6 | Pass |
| Demo sentence | Start for real to import scans into your personal browser library. | 11 | Pass |
| Demo state | Sample reading pack ready | 4 | Pass |
| Demo sentence | Demo projects are separate from your library and are discarded when you leave. | 13 | Pass |
| Demo action | Start for real | 3 | Pass |
| Banner label | Demo — sample data, nothing is saved to your library. | 10 | Pass |
| Banner sentence | This sample uses its own browser-only workspace. | 7 | Pass |
| Banner action | Reset demo | 2 | Pass |

## Landing status, error, and recovery copy

| State | Copy | Words | Result |
| --- | --- | ---: | --- |
| Offline sentence | You’re offline. | 2 | Pass |
| Offline sentence | Saved projects and cached OCR remain available. | 7 | Pass |
| Import status | Preparing your source pages locally… | 5 | Pass |
| Size error | Each source file must be 80 MB or smaller for reliable browser storage. | 13 | Pass |
| Mixed-file error | Import one PDF at a time, or choose a set of image pages. | 13 | Pass |
| Import success template | `{count} source pages ready.` | 4 | Pass |
| Import error | Those files could not be opened. | 6 | Pass |
| Import recovery | Use an unencrypted PDF, PNG, JPEG, or WebP scan. | 9 | Pass |
| Restore success template | `{count} projects restored.` | 3 | Pass |
| Restore error | That file is not a valid Scan Reading Pack backup. | 10 | Pass |
| License status | Checking your license… | 3 | Pass |
| License error template | `That license is {reason}.` | 5 | Pass |
| License recovery | The license could not be verified. | 6 | Pass |
| License recovery | Check the token and your connection. | 6 | Pass |
| License success | Paid features are active on this device. | 7 | Pass |
| License removal | License removed from this device. | 5 | Pass |
| Demo reset | Sample reading pack reset. | 4 | Pass |
| Offline-ready sentence | App shell cached. | 3 | Pass |
| Offline-ready sentence | You can reopen it offline. | 5 | Pass |
| Update sentence | A new app version is ready. | 6 | Pass |
| Update action | Update now | 2 | Pass |

## Footer

| Element | Copy | Words | Result |
| --- | --- | ---: | --- |
| Product name | Scan Reading Pack | 3 | Pass |
| Product sentence | Trace text back to the source page before you rely on it. | 12 | Pass |
| Link | Privacy | 1 | Pass |
| Link | Terms | 1 | Pass |
| Credit | Built by Param Factory · build 1.0.4 | 7 | Pass |
| Provenance | Original generated illustration · © 2026 Sociobot | 7 | Pass |

## Terminology

| Concept | Product term |
| --- | --- |
| Output | reading pack |
| Input | scan / source page |
| Text-to-page action | show on source page |
| Temporary sample | demo / sample data |
| Stored user work | saved reading packs / personal library |
| Paid entitlement | one-time license / paid features |
| Recognition | OCR / recognize |

The browser regression visits the landing, demo, privacy, terms, and 404
routes. It checks their rendered headings and copy against the banned-word and
metaphor lists, so future public copy changes are checked as user-visible
outcomes.

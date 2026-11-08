# Ghost Deck

A browser cassette deck for Kiroween 2026’s Resurrection category: two sides, local songs, rewind and the ritual of turning a tape over.

- [Live app](https://ghostdeck.djpapzin.com/)
- [Submitted project](https://devpost.com/software/ghost-deck)
- [Public judging source](https://github.com/djpapzin/ghost-deck-kiroween)
- [Submitted demo](https://www.youtube.com/watch?v=d2dYm-MwEa4) — 2:28

## Run locally

Requires Python 3 and a modern browser. No backend, account or API key.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ and start audio with a control press.

## Controls

- **Play/Pause:** start or pause the active side.
- **Load song:** use the dark button below the cassette to choose a local audio file for the visible side. Flip to load the other side.
- **Rewind:** stop music and reset only the active side. Either reel also rewinds. Reverse reel motion and the effect stop together; Play interrupts rewind.
- **Flip:** press Flip or click the noninteractive cassette body. Each side keeps its position; the destination arrives paused. Embedded reel and upload controls keep their own actions.
- **Inspect:** rotate with drag, swipe, arrow keys or the six view buttons. Looking at the back does not switch playback sides. The bottom opening shows tape movement; Pause holds it and Rewind reverses it.
- **Restore demo tape:** restore both generated demo tracks.

The current theme uses distressed monochrome MIX TAPE artwork, animated white hubs and a warm paper background in both the player and Inspect. Track and artist appear below the cassette.

One local song per side, not a multi-track editor. Files stay in the open page’s memory, are never uploaded, and disappear on reload. Embedded metadata is read locally with vendored jsmediatags 3.9.7 (BSD-3-Clause); unsupported tags fall back to the filename and Unknown artist. Browser codec support determines playback.

## Implementation and checks

Static HTML/CSS and JavaScript modules. transport.js owns audio and independent positions; main.js renders the player; inspect.js reuses transport state. Native controls, status announcements and reduced-motion handling are included.

```sh
node --test tests/*.test.mjs
python3 scripts/build-static.py
git diff --check
```

The build allowlists 17 deployable files. Cloudflare Pages uses direct upload; pushing a branch does not deploy it.

Every commit requires Codex review, including fixes and merge commits. Review evidence must cover the exact revision; tests and security checks are separate. See AGENTS.md.

## Current release and verification

The 8 November 2026 production release is based on engineering source bae16d473e0fb26d334a0481267208a728282a0a. This refresh preserves the public repository’s independent clean history. All commits received Codex review with no actionable findings. All 17 served files matched the merged static build byte for byte. Eight regression tests and the build passed.

Live browser checks covered Play/Pause, Back preserving Side A, Bottom tape state, rewind completion and Play interruption, Flip to paused Side B, local file-picker loading/playback, demo restore and Inspect open/close. At 390x844 the page had no horizontal overflow; no console errors/warnings were captured. DJ confirmed the local design and Inspect. A fresh physical-phone run and spoken screen-reader output were not verified for this release. Earlier phone results are historical evidence, not a new production test.

## Hackathon status and provenance

Ghost Deck was submitted to Kiroween on 6 November 2026; the entry remains published/submitted as verified on 8 November. The submitted video and initial public source snapshot at 1e5625f6ea1cbfc6a4c02c07f4cce8ca56133240 show the earlier build. This source refresh includes current production runtime assets. The submitted video still demonstrates the earlier build. The earlier snapshot and submitted video do not demonstrate the later Inspect and old-school design releases. See docs/hackathon-status.md for alignment work; do not claim the judging materials match current production yet.

Genuine Kiro review artifacts remain in .kiro/specs/ghost-deck-playback/. They record actual playback/animation reviews and fixes. Codex implemented changes and performed separate tests/reviews; newer work is not presented as additional Kiro work.

Code is MIT licensed. That does not relicense third-party audio. See audio/CREDITS.md for the generated music, effects and the uploader-statement basis of the rewind sample. The macOS-generated intro was removed from the released audio before submission. Keep private historical Git objects separate from the clean public judging repository.

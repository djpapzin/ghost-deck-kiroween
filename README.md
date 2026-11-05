# Ghost Deck

A browser cassette deck for Kiroween 2026’s Resurrection category. One built-in tape, two sides, and the ritual of playing, rewinding, and turning a cassette over.

## Run locally

Requires Python 3 and a modern browser. No build step, backend, account, or API key.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ from this directory. Start audio with a control press.

## Controls

- **Play/Pause:** start or pause the active side.
- **Rewind:** stop music and reset only the current side; either reel hole also rewinds. The effect and reverse reel motion stop together. Play interrupts the effect.
- **Flip:** click the noninteractive cassette body/paper label or press Flip. It pauses, saves the outgoing position, and turns over to the other side paused at its own saved position. Upload controls and reel holes keep their own actions.

Positions last for the open page session. Reload starts fresh. Choose one local song per side; files are not uploaded. No multi-track editing, recording, or saved mixtapes.

## Implementation and evidence

Static HTML/CSS and JavaScript modules. `transport.js` owns audio and per-side positions; `main.js` coordinates rendering and animation. Rapid commands invalidate stale async work and stop previous audio before starting another source. Native buttons, status announcements, and reduced-motion support are included.

Actual Kiro review artifacts are tracked under `.kiro/specs/ghost-deck-playback/`; browser checks and static reviews are distinguished there. DJ reported Play, Flip, and Rewind working on a phone over mobile data on 5 November 2026. Spoken screen-reader output remains unverified.

## Release status

Live address: https://ghostdeck.djpapzin.com/

Hosted on Cloudflare Pages by direct upload. Current release: PR #8, main commit `77e7a63d681743b8d7c1f49de4d2b6c3fdf3b046` (5 November 2026 SAST). Custom-domain HTTPS, cassette body flip, independent reel/upload actions and saved positions were verified in the browser. All ten page-referenced runtime assets matched main by SHA-256. Eight regression tests pass. Native Audio testing across 80 scripted rapid DOM clicks observed peak active source one, ending paused with zero active. These browser checks are separate from DJ’s earlier phone report.

Code is MIT licensed; this does not grant rights to third-party audio. Read [audio credits](audio/CREDITS.md) and [release checklist](RELEASE.md). The rewind sample is used on the uploader’s “copyright free” statement at DJ’s direction, with source attribution. The root `.kiro` directory must remain tracked.

## Load your own songs

Use the Load song control on the visible cassette face; flip to load the other side. The demo tape loads by default. Choose one local audio file for each side. Embedded title/artist tags are read locally using vendored jsmediatags 3.9.7 (BSD-3-Clause; see vendor/jsmediatags-LICENSE.md). MP3/ID3, M4A and FLAC tags are supported by the reader; other playable formats can fall back to the filename and Unknown artist. Browser codec support determines playback. The readout shows elapsed / total time, or --:-- until duration is known.

Selection pauses playback and resets only the replaced side. Restore demo tape restores both built-in sides. Files stay in memory for the open page, are never uploaded, and disappear on reload. No playlist, recording, persistence or sharing is included. This feature is included in the current live release.

Run transport regression checks with `node --test tests/*.test.mjs`. Build the isolated static package with `python3 scripts/build-static.py`.

## Click cassette to flip

Click the cassette body or paper label to flip using the existing paused, position-preserving transport. The upload controls and reel holes keep their own actions. The Flip button remains the keyboard control. This behavior is included in the current live release.

## Public judging snapshot

This repository contains a clean source snapshot of the reviewed Ghost Deck release candidate `2d63c163d09f7b774d95e479f0f387475616f37f`, prepared for Kiroween 2026. It starts with fresh Git history; the original engineering repository remains private. The genuine Kiro reviews, source, tests, MIT licence and BSD dependency notice are retained. Review documents describe the versions/scopes they originally reviewed.

Side A contains only the original generated music (12 seconds); the macOS-generated intro and old Git objects are not included. See audio/CREDITS.md for asset provenance. Personal song files are never bundled in this repo or uploaded by the app.

Public source: https://github.com/djpapzin/ghost-deck-kiroween . Working app: https://ghostdeck.djpapzin.com/ . Source publication and live promotion are verified separately; the live release evidence is recorded below after promotion. A public YouTube demo and final Devpost action are still pending.

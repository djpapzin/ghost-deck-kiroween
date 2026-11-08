# Ghost Deck release record

## Current production — 8 November 2026 SAST

- Live: https://ghostdeck.djpapzin.com/
- Hosting: Cloudflare Pages, ghost-deck; production direct upload succeeded, 17/17 files.
- Feature PR #15 -> dev 5c451042985a49ca5a90faa6d1351aee5cc542ab.
- Promotion PR #16 -> main bae16d473e0fb26d334a0481267208a728282a0a; closes issue #14.
- Scope: approved old-school artwork in player/Inspect, warm paper theme, animated white hubs and distinct Load song button below the cassette.
- DJ authorized merge/deployment; every feature and merge commit received Codex review without actionable findings.

## Validation

Eight regression tests, static build and diff checks passed. All 17 served files matched merged main by SHA-256; index.html is served at / because /index.html redirects.

Live browser acceptance passed: Play/Pause; Back preserving Side A; Bottom tape state; rewind completion and Play interruption; Flip landing paused on Side B; local file-picker load/playback; demo restore; Inspect open/close. At 390x844 there was no horizontal overflow. Captured console warnings/errors were empty.

Evidence: https://github.com/djpapzin/ghost-deck/pull/16#issuecomment-6718747992 . Codex promotion review: https://github.com/djpapzin/ghost-deck/pull/16#issuecomment-6718713252 .

Not newly verified: physical-phone production run and spoken screen-reader output. Earlier phone reports apply to their recorded builds.

## Hackathon materials

Kiroween entry was submitted on 6 November. The existing public judging repository and 2:28 video describe the earlier build; they have not been refreshed to include the current design. Follow docs/hackathon-status.md before claiming alignment. The independent public repository remains the source shared with judges; private engineering history must not be mirrored into it.

## Audio and publication boundary

Released Side A is music-only, with the old macOS-generated intro removed. The clean public judging repository was created separately from private engineering history. Rewind provenance and DJ’s uploader-statement release basis remain in audio/CREDITS.md; this is not independent ownership verification.

## Development and release workflow

main is the production source; develop future changes through dev and linked issue/PR pairs. Every commit, including fixes and merge commits, requires Codex review; resolve actionable findings and review the final revision before deployment. Run the tests, build and diff checks. Deploy only dist after specific authorization, then compare served assets and verify live behavior. The code being merged alone does not make a release complete.

## Historical milestones

- 5 November: initial Cloudflare Pages/custom-domain release and DJ-reported mobile-data playback checks.
- 6 November: music-only public judging snapshot, approved narrated demo and verified Kiroween submission. Inspect released through PR #13 with separate browser and dev-phone evidence.
- 8 November: old-school design release described above. Older proposed-hosting, pending-submission and speech-still-live statuses are superseded.

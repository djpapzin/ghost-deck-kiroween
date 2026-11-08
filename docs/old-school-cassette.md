# Old-school cassette design

## Scope and acceptance

Use the DJ-approved monochrome MIX TAPE artwork, warm paper background, white animated reel hubs, circular transport controls and Old school caption. Use the same artwork on the Inspect front and back, with distinct side badges and matching neutral edges. Keep current playback, local file loading, Flip, rewind cancellation, keyboard rotation, reduced motion and tape movement behavior. Track and artist remain readable below the cassette. No new transport features.

DJ approved the local visual preview and confirmed Inspect was working as expected on 8 November 2026. This is user-reported local verification, not production verification or a recorded physical-phone run.

## Artwork

old-school-art.png was generated with the built-in imagegen tool for this design using DJ’s supplied cassette screenshot as a reference. No TikTok interface or Sony branding is displayed. CSS crops the cassette portion from the generated concept and overlays live animated hubs; both main player and Inspect use one asset. The rest of the concept image is unused. No external fonts, remote image requests or new dependencies.

## Validation

Run node --test tests/*.test.mjs, python3 scripts/build-static.py, and git diff --check. Browser-check both sides, the upload controls, Play/Pause, rewind completion and interruption, Inspect front/back/bottom and keyboard rotation. At 390 px the page should fit without horizontal overflow.

## Release boundary

Released with DJ’s authorization via PR #15 into dev and PR #16 into main at bae16d473e0fb26d334a0481267208a728282a0a on 8 November 2026 SAST. Cloudflare production succeeded with 17/17 files; served assets match the build. Live browser checks passed; every commit received Codex review. The independent public judging snapshot and submitted video still describe the earlier build. Load song now appears as a distinct dark control below the cassette. New physical-phone and spoken screen-reader evidence remain missing.

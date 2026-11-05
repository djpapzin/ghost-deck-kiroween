# Public release checklist

Target: https://ghostdeck.djpapzin.com/

## Outstanding before publication

- [x] Record DJ’s explicit authorization to release using the uploader’s “copyright free” statement, with attribution and code-licence exclusion.
- [ ] Verify synthesized speech distribution terms or replace the spoken intro with DJ’s own cleared recording.
- [ ] Verify the complete public repository tree and history contain no secrets or private material.
- [ ] Review MIT code licence and the audio exclusions in CREDITS.md.
- [ ] Complete physical-phone playback and spoken screen-reader checks.

## Proposed hosting: Cloudflare Pages

The app is static and djpapzin.com currently uses Cloudflare nameservers. No hosting project or DNS record was changed during preparation. No DNS answer for ghostdeck.djpapzin.com was returned at the check on 5 November 2026.

After asset clearance, create a Pages project using a deployment directory containing only index.html, deck.css, main.js, transport.js, and the five WAV audio assets used by transport.js (side-a, side-b, click, flip, rewind-trimmed). Use no framework/build command. Avoid publishing the entire repository as the website root; retain .kiro in GitHub for judging.

Add ghostdeck.djpapzin.com through the Pages Custom domains screen first, then use the exact DNS destination Cloudflare supplies. Do not guess a pages.dev hostname. Keep other domain records unchanged. Verify domain ownership, HTTPS certificate, and actual app/audio loading after provisioning. If a paid plan is requested, stop and review it with DJ.

## Hosted acceptance

- [ ] Verify HTTPS and successful loading of all JS/CSS/audio assets.
- [ ] Verify Play/Pause; independent A/B positions; Flip arriving paused.
- [ ] Verify each reel and Rewind trigger reverse sound/motion without music overlap.
- [ ] Verify Play interrupts rewind and rapid presses do not overlap audio.
- [ ] Verify keyboard, reduced-motion, narrow viewport, real phone, and screen-reader behavior.
- [ ] Update README and Devpost draft with verified URL and remaining limitations.
- [ ] Capture screenshots and a public YouTube demo under three minutes.

## Release record — 5 November 2026 SAST

- PR #3 merged as 04ba0f7e3a22868b4afae80aa1a7f659ea80810e; code and five audio assets deployed unchanged.
- Cloudflare Pages project: ghost-deck. URL: https://ghost-deck.pages.dev/ . Direct upload reported 11/11 files and successful deployment.
- Custom domain: https://ghostdeck.djpapzin.com/ . Cloudflare reports Active and SSL enabled. CNAME ghostdeck -> ghost-deck.pages.dev, proxied, Auto TTL. No other DNS records changed.
- The Pages URL was tested in the local IAB: both sides play, Flip arrives paused and restores positions, both holes and Rewind enter rewind, Play interrupts it, rapid controls settle correctly with no console errors observed. Nine runtime files returned 200 and their SHA-256 hashes match main.
- DJ reported all requested Play, Flip and Rewind phone checks work on mobile data. This is a user-reported physical-device result; device/OS/browser were not recorded.
- Custom-domain navigation from the release browser initially failed because the local router cached an earlier NXDOMAIN. Authoritative Cloudflare, 1.1.1.1 and 8.8.8.8 resolve it; the router cache is allowed to expire without changing network settings.
- No Devpost form action was taken. Spoken screen-reader checks and public video remain open. The GitHub repo remains private until its public-repository release.

## Development workflow

main is the release source. dev starts from the released main. Build future features on dev and review a PR to main before promoting; direct-upload hosting does not automatically deploy either branch. Run python3 scripts/build-static.py and upload dist for an explicitly approved release. Never deploy a feature simply because dev changed.

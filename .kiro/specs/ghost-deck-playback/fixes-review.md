# Ghost Deck — Follow-up Fixes Verdict

Re-read `main.js`, `deck.css`, `index.html`, `transport.js`, and
`animation-review.md` (which carries a Codex browser-checks appendix).
`transport.js` is unchanged; the fixes live in `main.js`/`deck.css`/`index.html`.
Only this file was written; no app files changed, no shell commands run.

Two evidence tiers, kept distinct:
- **[inspection]** — concluded from reading current source.
- **[Codex browser]** — passed checks recorded in the `animation-review.md`
  appendix: delayed face change; saved positions A 0:01 / B 0:02; paused
  arrivals; Play/Rewind interruption of an outgoing flip; left/right reel + Rewind
  backward spin, effect playback, Play interruption; peak active media count one.

## 1. Fix verification (against prior findings)

| Prior finding | Fix | [inspection] | [Codex browser] | Status |
|---|---|---|---|---|
| C1/C2 duplicate CSS | Removed shadowed `.24s` + 2nd `@media` | Only one `.rewinding .reel i` (`.8s reverse`) and one reduced-motion block remain | "backward spin" passed | **Resolved** |
| §2.2a midpoint flash | Inline edge-on hold | `deck.style.transform='…rotateY(-90deg)…'` set before `outgoing.cancel()`; `transform=''` cleared at `turnCassette` start/end and by interrupters — by construction no 0deg paint mid-flip | "delayed face change" passed (supportive, not an explicit flash test) | **Resolved (inspection); browser-supportive** |
| §2.2b non-Flip cancel/settle | Button handler | For `action !== 'flip'`: `flipGeneration++; deck.getAnimations().forEach(a=>a.cancel()); deck.style.transform=''; showSide(requestedSide)` then `transport[action]()`. `requestedSide` = current transport side; cancel+clear are synchronous (no mid-state paint) | "Play/Rewind interruption of an outgoing flip" + "paused arrivals" passed | **Resolved (inspection + browser)** |
| C4 live side announce | `#side` live region | `aria-live="polite" aria-atomic="true"`; written at flip midpoint and on non-flip face-settle | none recorded about AT output | **Resolved at DOM level (inspection); AT not empirically verified** |
| §8.1 rewind asset | — | `transport.js` unchanged; still refs `audio/rewind-trimmed.wav?v=trimmed-2` | "effect playback" passed → asset loads/plays | **Empirically resolved (Codex browser)** |

## 2. Regression check

- **Saved positions — no regression.** `transport.js` unchanged (per-side
  `positions={A,B}`; `flip()` saves leaving side before swap; `rewind()` touches
  only current side). The new `main.js` handler writes only DOM, never transport
  state. [Codex browser] retained "A 0:01, B 0:02".
- **Rewind cleanup — no regression.** `transport.js` unchanged (`stopEffects`
  pauses+resets `click`/`rewindSound` and clears `rewinding`; `rewind()`'s
  `'ended'` self-clear + `.catch` generation guard intact). The non-Flip handler
  cancels only deck WAAPI animations, not the `Audio` elements.
  [Codex browser] "backward spin, effect playback, Play interruption … peak
  active media count one" — effect self-clears, no audio overlap.

## 3. Remaining issues (all minor)

1. **Reduced motion — no recorded browser evidence [inspection-only].** CSS
   `@media` blocks + `matchMedia` branch are correct by inspection, but no
   reduce-motion run is in the appendix. Recommend a quick check (toggle reduce
   motion; confirm no reel spin, no flip rotation).
2. **AT live-region — not empirically verified [inspection-only].** Attributes
   and write path are correct; no screen-reader output recorded. Recommend an
   AT pass to confirm "Side B" announces on flip / face-settle.
3. **`#track` not a live region [inspection].** Side is announced; track name
   ("After Hours"/"First Light") is not. Outside "side announcement" scope; a
   small related gap if full-face AT parity is wanted.
4. **Unconditional `showSide(requestedSide)` on non-Flip click [trivial].**
   Redundant write when no flip is in progress (polite live regions usually
   suppress identical-text announcements). Not a bug — the call is required for
   the mid-flip interruption case.
5. **C3 unchanged [design, accepted].** Reels snap to 0deg on pause, not frozen
   (animation removal, not `animation-play-state`). Not a fix target.

## 4. Verdict

All four requested fixes are in place and correct by inspection; non-Flip
cancellation/face-settling, saved positions, and the rewind effect are
additionally confirmed by recorded Codex browser evidence, and the rewind-asset
risk is empirically cleared. No regressions in saved positions or rewind cleanup.

**Blockers: none.** The only worthwhile follow-ups are browser/AT confirmations
for the two inspection-only items (reduced motion, live-region announcement),
both already handled correctly by construction.

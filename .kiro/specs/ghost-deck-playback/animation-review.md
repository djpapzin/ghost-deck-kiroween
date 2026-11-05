# Ghost Deck — Animation & Playback Static Review

Scope: `main.js`, `transport.js`, `deck.css`, `index.html` (read in full). This is a
static (read-only) review of the five requested concerns. No app files were
modified and no shell commands were run; only this review file is written.

Note: the files on disk are materially richer than the session-start snapshot —
there is now a Web Animations API (WAAPI) cassette-flip routine, clickable reel
buttons, a dedicated rewind sound with a coupled `rewinding` flag, and detailed
reel CSS. The review below is based on the current on-disk content.

---

## 1. Animation inventory (what actually exists)

| Motion | Where defined | Trigger |
|--------|---------------|---------|
| Reel spin (play) | `.playing i { animation: spin 2s linear infinite }` + `@keyframes spin` | `deck.classList.toggle('playing', status === 'Playing')` in the `main.js` render callback |
| Reel spin (rewind, reverse) | `.rewinding .reel i { animation: spin … reverse }` (declared twice — see §4.3) | `deck.classList.toggle('rewinding', rewinding)` |
| Rewind window glow | `.rewinding .window { box-shadow: inset 0 0 12px #ed754b55 }` | same `.rewinding` toggle |
| Cassette flip (3D rotateY) | `turnCassette()` in `main.js` via `Element.animate()` (WAAPI) | side change in render callback, when `requestedSide !== side` |
| Reduced-motion guard | CSS `@media (prefers-reduced-motion: reduce)` + JS `matchMedia` check in `turnCassette` | OS / browser setting |

There are **no CSS `transition` properties** anywhere; every visual change is
either an instant class/data swap or a keyframe/WAAPI animation. Position is
shown only in the `#time` readout; reel rotation is **not** tied to the audio
offset — it indicates motion state, not position.

The reels are now `<button class="reel" data-action="rewind">` (left and right),
so a reel click routes through the same `transport.rewind` as the Rewind
control button (`button.dataset.action ?? button.textContent.toLowerCase()`).

---

## 2. Flip animation assessment

`main.js` `turnCassette(side)`:

```
generation = ++flipGeneration
deck.getAnimations().forEach(a => a.cancel())     // cancel prior deck animations
if (reduced motion) { showSide(side); return }
outgoing = deck.animate([0deg→90deg, scale1→.93], {275ms, ease-in, fill:forwards})
await outgoing.finished
if (generation !== flipGeneration) return          // stale → bail
showSide(side)                                    // swap label/track at edge-on
outgoing.cancel()
incoming = deck.animate([-90deg→0deg, scale .93→1], {275ms, ease-out})
await incoming.finished
catch → swallow (a newer flip owns the display)
```

### 2.1 What works
- **Content swap at the midpoint.** `showSide` (label, `data-side`, track name)
  runs only after `outgoing.finished` (deck edge-on at 90deg), then the incoming
  half rotates back to front. This hides the swap behind the edge-on frame.
- **Stale-flip invalidation.** A private `flipGeneration` counter plus the
  `generation !== flipGeneration` check after `await outgoing.finished` discards
  a flip superseded before its midpoint. A newer `turnCassette` also calls
  `deck.getAnimations().forEach(a => a.cancel())`, which rejects the in-flight
  `outgoing.finished`/`incoming.finished` promises (caught and swallowed).
- **Reduced motion.** When `matchMedia('(prefers-reduced-motion: reduce)')`
  matches, `turnCassette` calls `showSide(side)` and returns — no rotateY.
- **Side-label/track correctness after rapid A→B→A.** If the second flip lands
  before the first's midpoint, the first never calls `showSide`, so the label
  never flashes to B; the final label matches the final side. (If it lands
  after the first midpoint, the first `showSide('B')` already ran; the second
  flip's midpoint `showSide('A')` corrects it — see §2.2.)

### 2.2 Observations / minor risks
- **Mid-interruption content lag.** If flip #2 arrives *after* flip #1 already
  ran `showSide('B')` (past midpoint), the label is `B` while flip #2's outgoing
  half rotates; it only corrects to `A` at flip #2's midpoint (~275 ms later).
  Final state is correct; there is a brief label/rotation mismatch window.
- **Potential 1-frame front-facing flash at the flip midpoint.** `outgoing`
  uses `fill: forwards` to hold at 90deg, then `outgoing.cancel()` is called to
  free the transform before `incoming` starts at -90deg. Between `cancel()`
  (deck reverts to 0deg/base) and the incoming animation's first computed frame
  (-90deg), a paint could in principle render the deck front-on at 0deg for one
  frame, showing the newly-swapped content before the back-half begins. In
  practice WAAPI commits the new animation before the next paint, so this is
  usually invisible — but it is timing-dependent and worth a visual check.
- **`deck.getAnimations()` only cancels deck-level animations.** It returns
  animations whose target is `.cassette`, not the reels' CSS `spin` animations
  (those target the `i` elements). That is fine here because a flip sets
  `status = 'Paused'` and `rewinding = false`, so `.playing`/`.rewinding` are
  removed and the reels are static during a flip anyway — but the call does
  not, and is not meant to, cancel reel spin.
- **Rewind/Play during a flip do not cancel the flip animation.** Only a new
  `turnCassette` calls `getAnimations().cancel()`. Pressing Rewind or Play
  mid-flip leaves the rotateY running to its 550 ms completion while the reels
  change state. Final state is correct; the deck just keeps rotating briefly.

### 2.3 Verdict
Flip animation is functional, reduced-motion-aware, and stale-flip-safe. The
items in §2.2 are minor visual/edge concerns, not correctness bugs.

---

## 3. Rewind animation assessment

`transport.js` `rewind()`:

```
pause()                                   // status=Paused; stopEffects() → rewinding=false
positions[side] = 0; completed[side] = false; seek(media)
attempt = generation
rewinding = true
rewindSound.play().catch(() => { if (attempt !== generation) return; rewinding = false; update() })
update()
```

Plus, at construction: `rewindSound.addEventListener('ended', () => { if (!rewindSound.ended) return; rewinding = false; update() })`.

### 3.1 What works
- **Visual ↔ audio coupling.** `rewinding = true` toggles `.rewinding`
  (reverse-spinning reels + window glow + status label "Rewinding"); the
  `rewindSound` `'ended'` listener clears `rewinding` and re-renders when the
  sound finishes, so the animation lasts exactly as long as the sound.
- **Rapid rewind cancellation.** `rewind()` calls `pause()` first, and
  `pause()` calls `stopEffects()` which pauses + resets `rewindSound` and sets
  `rewinding = false`. The previous `rewindSound.play()` promise rejects
  (AbortError); its `.catch` checks `attempt !== generation` and returns, so it
  does not clobber the new rewind's `rewinding = true`. Latest rewind wins.
- **Failure fallback.** If `rewindSound.play()` rejects (e.g. blocked), the
  `.catch` resets `rewinding = false` only when this rewind still owns the
  generation, so a failed sound does not leave the reels stuck in rewind.
- **No overlap with main audio.** Rewind runs `pause()` first, so the main
  `media` is paused; only `rewindSound` plays during the rewind visual.

### 3.2 Observation
- **Reels reverse-spin at the CSS-defined rate, not the audio rate.** The reel
  animation duration is fixed in CSS; it is not synced to actual seek progress
  (there is no real seeking — position just resets to 0). This is an aesthetic
  effect, not a scrubber. Acceptable for the cassette metaphor.

### 3.3 Verdict
Rewind animation is functional and self-cleaning via the sound `'ended'` hook,
with correct rapid-cancellation semantics.

---

## 4. CSS findings (rewind reel animation)

### 4.1 Duplicate, conflicting `.rewinding .reel i` animation duration — minor defect
`deck.css` declares the rewind reel animation **twice** with different durations:

```
.rewinding .reel i { animation: spin .24s linear infinite reverse; }   /* early */
…
.rewinding .reel i { animation: spin .8s  linear infinite reverse; }   /* later */
```

Both selectors have identical specificity (0,2,1), so the **later** declaration
wins and the effective rewind spin is **`.8s` reverse**. The intended
fast-rewind `.24s` rule is dead code, fully shadowed. If `.24s` was the
intended look, this is a latent bug; if `.8s` is now intended, the `.24s`
block should be removed to avoid confusion. Either way the duplication is a
real inconsistency to resolve.

### 4.2 Redundant reduced-motion blocks — harmless
There are two `@media (prefers-reduced-motion: reduce) { .rewinding .reel i { animation: none } }`
blocks. Redundant but not harmful (both resolve to `animation: none`). The
early one is shadowed by the later; only the later is effective.

### 4.3 Specificity is otherwise sound
- Play spin: `.playing i` (0,1,1). During play, `.rewinding` is absent, so only
  `.playing i` applies (forward 2s).
- Rewind spin: `.rewinding .reel i` (0,2,1) overrides `.playing i` (0,1,1) —
  though in practice both classes are never on simultaneously (rewind forces
  `status = 'Paused'`).
- Reel detail styling `.window .reel i` (0,2,1) correctly overrides the base
  `.window i` (0,1,1) for `border`/`background`/`box-shadow`.

### 4.4 Reels snap to 0 on pause (not frozen) — design note
`.playing`/`.rewinding` drive `animation`; removing the class removes the
animation, so the reel reverts to its base transform (0deg) rather than
freezing at its current angle. To freeze-in-place you would use
`animation-play-state: paused`. The current snap-to-zero is a stylistic choice,
not a bug.

---

## 5. Side position retention

Position data lives in `transport.js` `positions = { A: 0, B: 0 }` and is
unchanged in its retention logic from the prior transport review:
- `flip()` calls `pause()` **before** swapping `side`, saving the leaving
  side's `media.currentTime` (guarded by `positioned`); `loadSide()` then
  restores the arriving side to its own `positions[side]` on `loadedmetadata`.
- `rewind()` only touches `positions[side]`/`completed[side]` for the current
  side, so the other side's offset is untouched.

Animation/display angle:
- The `#time` readout is driven by `render({ position: positions[side] })` and
  updates on every `update()` (transitions, `timeupdate` while playing,
  `loadedmetadata`). On flip it shows the arriving side's preserved offset; on
  rewind it shows `0:00`.
- Reel rotation conveys **motion state**, not position — it does not reflect
  how far into a side you are. Position is conveyed solely by the readout. This
  is consistent and intentional.

### 5.1 Verdict
Both side offsets are retained across flip and unaffected by rewind/rewind
animation. Position display is correct. (Deeper position-preservation traces
are in the companion `review.md`; the animation layer does not perturb them.)

---

## 6. Rapid cancellation (cross-control, animation effects)

- **Play/Pause spam:** `.playing` toggles with `status === 'Playing'`, which is
  only set after `await track.play()` resolves and passes the `generation` /
  `media !== track` guards. During `'Starting'` the class is off, so a Pause
  that cancels a pending Play never lit the reels. No stuck spin.
- **Flip spam:** `flipGeneration` + `getAnimations().cancel()` — latest flip
  wins; superseded flips abort at their midpoint check or via cancelled
  promises (§2.1/§2.2).
- **Rewind spam:** `pause()`/`stopEffects()` reset `rewinding` and
  `rewindSound` before each new rewind; the `.catch` generation guard prevents
  a stale failure from clearing the active `rewinding` (§3.1).
- **Flip ↔ Play/Rewind:** Play/Rewind do not cancel an in-flight flip
  animation (§2.2), but final visual/state converge correctly.

### 6.1 Verdict
Rapid cancellation is correct for state and for the `.playing`/`.rewinding`
class lifecycles. The only residual is cosmetic: a flip may continue rotating
to completion if interrupted by Play/Rewind, and mid-flip label timing can lag
by up to ~275 ms.

---

## 7. Reduced motion

Coverage is complete across both layers:
- **CSS:** `@media (prefers-reduced-motion: reduce)` disables `.playing i`
  (play spin) and `.rewinding .reel i` (rewind spin). There are no transitions
  to disable, and the instant color/label/readout changes are not motion.
- **JS:** `turnCassette` checks `matchMedia('(prefers-reduced-motion: reduce)')`
  and, when it matches, calls `showSide(side)` and returns without running the
  rotateY WAAPI animation.

Both checks reference the same media feature, so behavior is consistent: a
reduced-motion user gets instant side/track/readout/status updates with no
reel spin, no rewind spin, and no flip rotation.

### 7.1 Verdict
Reduced motion is fully handled for every motion effect present.

---

## 8. Sound-end cleanup

`transport.js` `stopEffects()` (which replaced the earlier `stopClick`) pauses
and resets **both** `click` and `rewindSound` to 0 (when `readyState` allows),
and sets `rewinding = false`. It is called from `pause()`, the top of `play()`,
and the main `media` `'ended'` handler.

- **Side end:** `media 'ended'` → `stopEffects()` (halts any click/rewind
  sound) → `click.play()` plays the single end-stop click; `status = 'Ended'`
  → render removes `.playing` (reels stop) and shows "Ended". One click, reels
  stopped, no bleed.
- **Rewind sound end:** `rewindSound 'ended'` → `rewinding = false` → render
  removes `.rewinding` (reels stop, glow off, status returns to "Paused"). The
  effect is self-cleaning.
- **Interrupting rewind:** any Play/Pause/Flip/Rewind calls `pause()` →
  `stopEffects()`, which pauses `rewindSound` (no `'ended'` fires) and clears
  `rewinding`, so a half-finished rewind sound cannot leave the reels spinning.
- **Click reuse:** `click` is a single shared element; every play of it is
  preceded by `stopEffects()`, so it cannot overlap itself or the main track.

### 8.1 Risk to verify — `audio/rewind-trimmed.wav` existence
`transport.js` constructs `rewindSound = makeAudio('audio/rewind-trimmed.wav?v=trimmed-2')`.
The session-start file tree listed only `click.wav`, `side-a.wav`, `side-b.wav`
under `audio/` — no `rewind-trimmed.wav`. (The app code was clearly updated
after that snapshot, so the asset may have been added; this review did not list
the directory.) If the file is missing, `rewindSound` will fail to load:
`rewindSound.play()` rejects → the `.catch` clears `rewinding`, so the rewind
animation would flash for ~1 frame then stop, and the natural `'ended'` cleanup
would never fire. Confirm the asset exists (task V-A1).

### 8.2 Verdict
Sound-end cleanup logic is correct and mutually exclusive across the two
effect elements, with a self-clearing rewind effect. The only open item is
confirming the rewind asset is present (§8.1).

---

## 9. Accessibility notes (incidental, out of the five core concerns)

- Reel buttons have `aria-label`/`title` ("Rewind using left/right reel") and
  the inner `i`/`span` are `aria-hidden` — decorative motion is hidden from AT.
- `#status` has `role="status"`, so status/`Rewinding` changes are announced.
- **Minor:** `#side` is a plain `<strong>` (not a live region), so a flip's new
  side/track is not announced to screen-reader users via a live region (only
  the status changes are). Not required, but worth noting if AT parity for the
  side change is desired.

---

## 10. Findings summary

| ID | Concern | Verdict | Detail |
|----|---------|---------|--------|
| F1 | Flip animation | **Pass (by inspection)** | WAAPI rotateY with midpoint content swap; `flipGeneration` + `getAnimations().cancel()` make it stale-flip-safe; reduced-motion skips it. Minor: possible 1-frame midpoint flash (§2.2), mid-flip label lag on late interruption (§2.2). |
| F2 | Rewind animation | **Pass (by inspection)** | `rewinding` flag drives reverse-spin + glow; coupled to `rewindSound 'ended'` for self-cleaning; rapid-cancellation correct. |
| F3 | Side position retention | **Pass (by inspection)** | Per-side `positions` preserved across flip; rewind/animation do not perturb the other side; readout reflects current side's offset. |
| F4 | Rapid cancellation | **Pass (by inspection)** | State and `.playing`/`.rewinding` class lifecycles are correct under spam. Cosmetic only: flip may run to completion if interrupted by Play/Rewind. |
| F5 | Reduced motion | **Pass** | All motion (play spin, rewind spin, flip rotation) disabled via CSS media query + JS `matchMedia`. No transitions exist. Complete. |
| F6 | Sound-end cleanup | **Pass (conditional)** | `stopEffects` mutual-excludes click/rewindSound; rewind self-clears on `'ended'`. Conditional on confirming `audio/rewind-trimmed.wav` exists (§8.1). |
| C1 | Duplicate `.rewinding .reel i` duration | **Minor defect** | `.24s` rule shadowed by later `.8s` rule (same specificity); effective rewind spin is `.8s`. Resolve the duplication (§4.1). |
| C2 | Redundant reduced-motion blocks | **Trivial** | Two identical `@media` blocks for `.rewinding .reel i`; harmless (§4.2). |
| C3 | Reels snap to 0 on pause | **Design note** | Not frozen at angle; uses animation removal rather than `animation-play-state` (§4.4). |
| C4 | Side change not announced to AT | **Minor a11y** | `#side` is not a live region (§9). |

### Blockers
None for the five requested concerns. The one item that can break the rewind
animation at runtime is the possible absence of `audio/rewind-trimmed.wav`
(F6/§8.1) — that is a verification task, not a code defect. The only concrete
code-level cleanup is C1 (duplicate/shadowed CSS animation duration).

---

## 11. Verification tasks

Static review can only go so far; these convert the verdicts to empirical
evidence. Serve per the README and open http://127.0.0.1:8765/. Turn OS/browser
"reduce motion" on/off where noted.

### V-A1 — Confirm rewind asset exists (unblocks F6)
1. In DevTools → Network, trigger Rewind and confirm `audio/rewind-trimmed.wav`
   loads with HTTP 200 (not 404).
2. **Pass:** file loads; rewind sound is audible; reels reverse-spin for the
   sound's duration and stop when it ends.

### V-A2 — Flip animation visual (reduced motion OFF)
1. Press **Flip**. Confirm a ~550 ms 3D rotateY with the side label/track
   swapping at the edge-on midpoint, settling front-on.
2. Press **Flip** repeatedly. Confirm the latest side wins and the deck never
   ends sideways or stuck mid-rotation.
3. **Pass:** smooth flip, correct final side/track, no stuck transform.

### V-A3 — Flip under reduced motion ON
1. Enable "reduce motion" (OS setting or DevTools rendering panel).
2. Press **Flip**. Confirm the side label/track and readout swap **instantly**
   with no rotation, and the deck never rotates.
3. **Pass:** instant swap, zero motion.

### V-A4 — Rewind animation (reduced motion OFF)
1. Press **Rewind** (button or a reel). Confirm reels reverse-spin, the window
   glows orange, the status reads "Rewinding", and the readout is `0:00`.
2. Let the rewind sound finish. Confirm reels stop, glow clears, status returns
   to "Paused" — automatically, with no extra input.
3. **Pass:** animation lasts exactly the sound's length and self-cleans.

### V-A5 — Rewind under reduced motion ON
1. With "reduce motion" on, press **Rewind**.
2. **Pass:** no reverse-spin, no glow motion (status still reads "Rewinding"
   and readout `0:00`); the effect still self-clears when the sound ends.

### V-A6 — Play spin under reduced motion ON
1. With "reduce motion" on, press **Play**.
2. **Pass:** audio plays and readout advances, but reels do **not** spin.

### V-A7 — Rapid cancellation, visuals
1. Spam **Play/Pause** quickly. Confirm reels never stay spinning after you
   settle on Pause, and never spin during the brief "Starting" window.
2. Spam **Flip** quickly. Confirm the deck converges to the final side and is
   never left sideways.
3. Spam **Rewind** quickly. Confirm reels don't get stuck in reverse-spin; the
   last rewind's animation is the one that plays out.
4. **Pass:** no stuck/lingering motion in any of the three.

### V-A8 — Interrupt a flip with Play/Rewind (cosmetic check)
1. Press **Flip** and, mid-rotation, press **Play** (then **Rewind**).
2. **Pass (accept):** final state is correct (correct side, playing/rewinding as
   expected). Note per §2.2 that the flip rotation may run to completion rather
   than snap — acceptable, not a defect.

### V-A9 — Sound-end cleanup
1. Let a side play to the end. Confirm: reels stop, one end-click plays, status
   "Ended", no rewind sound or doubled click.
2. Press **Rewind** immediately after the end. Confirm the end-click stops and
   the rewind sound/animation take over cleanly.
3. **Pass:** no audio bleed between end-click and rewind, no overlapping sounds.

### V-A10 — Side position retention across animation (ties to F3)
1. Play A to ~`0:30`, Flip to B, Play B to ~`0:15`, Flip back to A.
2. Confirm A shows ~`0:30`; Flip to B confirms B shows ~`0:15`.
3. **Pass:** offsets preserved across the flip animation; readouts match.

---

## 12. Recommended next steps (no code change required to pass)

1. Run V-A1 to confirm the rewind asset (resolves the only conditional finding).
2. Resolve C1: pick one `.rewinding .reel i` duration and delete the other (and
   collapse the duplicate reduced-motion block — C2) to remove the shadowed
   rule. Optional; behavior is currently just the `.8s` value.
3. The five reviewed concerns (flip animation, rewind animation, side position
   retention, rapid cancellation, reduced motion, sound-end cleanup) need no
   transport/CSS logic change to pass their verification tasks.

## Codex follow-up fixes and browser checks

Removed the shadowed rewind duration and duplicate reduced-motion rule. Added a polite atomic live region to the side label. The midpoint now holds an inline edge-on transform between animation halves. Play, Pause and Rewind cancel a pending flip and settle the face immediately on the current transport side.

Browser checks passed for delayed face change, both saved positions (A 0:01, B 0:02), paused arrivals, and Play/Rewind interruption of an outgoing flip. Left reel, right reel and Rewind passed backward spin, effect playback and Play interruption checks with peak active media count one. These are Codex follow-up results, separate from Kiro's original static review.

# Ghost Deck — Playback Review

Scope: `transport.js` (the `createTransport` factory) and how it interacts with
`main.js`, `index.html`, and `deck.css`. Two concerns were requested:

- **A. Flip pauses and preserves both side positions.**
- **B. No overlapping audio during rapid Play / Pause / Rewind / Flip.**

Constraint honored: the built-in tape (`.cassette`) and the four controls
(Play / Pause / Rewind / Flip) are untouched. No app files were modified and no
shell commands were run. This document is review + verification tasks only.

---

## 1. How the transport works (reference for the findings)

State held in the closure:

| Symbol        | Role |
|---------------|------|
| `positions = { A: 0, B: 0 }` | Per-side playback offset, in seconds. The source of truth for "each side keeps its place." |
| `completed = { A: false, B: false }` | Per-side "reached the end" flag. Drives the restart-from-zero on next Play. |
| `click`        | One shared `Audio('audio/click.wav')`, created once. |
| `side`         | `'A'` or `'B'` — the currently mounted side. |
| `media`        | The currently mounted `HTMLAudioElement` for `side`. Replaced by `loadSide()`. |
| `generation`   | Monotonic counter. Incremented by every mutating op (pause, flip-via-pause, rewind-via-pause, ended, and each Play attempt). |
| `status`       | `'Paused' \| 'Starting' \| 'Playing' \| 'Ended' \| 'Could not play'`. |
| `positioned`   | True once the mounted track has been seeked to `positions[side]` and has metadata (`readyState > 0`). Guards position-save vs. premature save. |

Key invariants used by both concerns:

1. **`loadSide()` always pauses the outgoing media first** (`media?.pause()`)
   before assigning a new element to `media`. So at most one `media` element is
   ever unpaused.
2. **Every async `await track.play()` is gated by `attempt !== generation ||
   media !== track`** after it settles. Any mutation that changed `generation`
   or swapped `media` discards the stale result.
3. **`play()` early-returns while `status` is `'Starting'` or `'Playing'`**, so
   `track.play()` is never issued twice on the same element in succession.
4. **`timeupdate` only writes `positions[side]` when `status === 'Playing'` and
   `positioned`** — it never records a transient/pre-seek value.

---

## 2. Concern A — Flip preserves both positions

### Verdict: Correct.

Trace of a mid-track flip A → B → A:

1. **Side A playing at ~30s.** `timeupdate` has been writing `positions.A`
   (only while `status === 'Playing'` and `positioned`).
2. **Flip pressed.** `flip()` calls `pause()` *before* changing `side`:
   - `pause()`: `generation++`; `media.pause()`; `stopClick()`; because the
     side-A track is `positioned`, `positions.A = media.currentTime` (≈30);
     `status = 'Paused'`.
   - Then `side = 'B'`, `loadSide()` mounts a fresh `side-b.wav` element and
     sets `positioned = false`.
   - On that track's `loadedmetadata`, the handler runs `seek(track)` (because
     `!positioned`), which sets `currentTime = positions.B` and
     `positioned = true`. Side B resumes from *its own* saved offset.
3. **Flip back to A.** Same sequence in reverse: `pause()` saves `positions.B`
   (B's current spot), `side = 'A'`, `loadSide()` mounts `side-a.wav`, and on
   `loadedmetadata` it seeks to `positions.A` (≈30). Side A is back where it was.

The two offsets live in separate keys of the same map and are read/written only
under the matching `side`, so there is no cross-contamination. Rewind only
touches `positions[side]` / `completed[side]` for the *current* side, so it
cannot corrupt the other side's offset either.

### A.1 Edge case — flipping while a side is mid-load (`positioned === false`)

If you flip to B before B's metadata has arrived, then immediately flip back to
A, `pause()` sees `positioned === false` for B and intentionally does **not**
overwrite `positions.B` (B never advanced, so keeping the prior value is
correct). The orphaned B track's `loadedmetadata`/`timeupdate` listeners are
no-ops because of the `media !== track` guard. Position integrity holds.

### A.2 Edge case — flipping away from a side that has ended

When a side ends, the `ended` handler sets `completed[side] = true` and
`positions[side] = track.currentTime` (== duration). Flipping away preserves
that; flipping back seeks to `duration` (the tape sits at the end, status
`Paused`). Pressing Play then hits `if (completed[side])` → resets to `0` and
restarts. This is consistent and matches the README flow
("Play Side A through the stop, flip to Side B, then press Play").

> Note (not a bug): the stored post-end value equals `duration`, and `seek()`
> clamps `Math.min(positions[side], track.duration)` for playback but leaves the
> stored value un-clamped. Displaying the end time after returning to a
> finished side is accurate behavior; the `completed` flag handles the restart.

---

## 3. Concern B — Overlapping audio during rapid controls

### Verdict: No overlapping main audio found. The click is also single-instance and always reset before reuse.

### B.1 Why two main tracks can't play at once

The only `media.play()` calls are inside `play()`, and three layers prevent
overlap:

- **Outgoing element is paused on every swap.** `loadSide()` (called by
  `flip()`, by the `'Could not play'` recovery, and at init) runs
  `media?.pause()` before reassigning `media`. `pause()` (called by `flip()`,
  `rewind()`, and the exported Pause) also runs `media.pause()`. So whenever
  `media` changes, the previous element is already paused.
- **Pending `play()` promises are invalidated.** Each Play captures
  `attempt = ++generation` and checks `attempt !== generation || media !== track`
  after `await`. A `pause()`/`flip()`/`rewind()`/`ended` that lands during the
  await bumps `generation` (and flip/rewind also swap or re-seek `media`), so the
  stale promise's resolution is discarded and never sets `status = 'Playing'`.
- **No double start on the same element.** `play()` returns early if `status` is
  already `'Starting'` or `'Playing'`. So `track.play()` is issued at most once
  per starting transition.

Because an element can reach `status === 'Playing'` only when it is still the
current `media` **and** no generation bump occurred since its attempt, only the
current element can be "playing," and it is the only one that was ever left
unpaused. There is no path to two audible main tracks.

### B.2 Rapid sequences walked through

- **Play → Flip → Play (during the first await):** Flip's `pause()` calls
  `media.pause()`, which rejects the pending `play()` (AbortError); its catch
  returns early on the generation mismatch. The new side then Plays from its
  own offset. Old track paused before new track starts. No overlap.
- **Play (resolves) → Flip:** Audio A is briefly audible, then Flip's
  `pause()` stops it synchronously before `loadSide()` mounts B. No overlap.
- **Spamming Play/Pause:** Each `pause()` saves the current offset and bumps
  `generation`; each Play starts a fresh attempt. At worst a single brief blip
  per toggle; never two sustained sources.
- **Rewind during `Starting`:** `rewind()` → `pause()` bumps `generation`,
  pauses the track, resets `positions[side] = 0`, and re-seeks. The in-flight
  `play()` is discarded by the generation check. Ends in `Paused` at 0.
- **Ended → Play (no flip):** `stopClick()` at the top of `play()` halts the
  end-click; `completed[side]` resets the offset to 0; the same element replays
  from the start. Click and media never overlap.
- **Ended → Flip:** Flip's `pause()` → `stopClick()` stops the end-click before
  the other side mounts. Click does not bleed across the flip.

### B.3 The click channel

`click` is one `Audio` created once. It is played only in the `ended` handler
(when `media` has already stopped) and is always preceded by `stopClick()`,
which `pause()`s it and rewinds to 0 when `readyState` allows. Both `pause()`
and the top of `play()` call `stopClick()`. So the click cannot overlap itself
and cannot overlap the main track.

### B.4 Minor observation (not an overlap/position bug)

- **Orphaned elements & listeners.** Each `flip()` (and each `'Could not play'`
  reload) calls `makeAudio(...)` — i.e. `new Audio(url)` — and never removes the
  previous element or its `loadedmetadata`/`timeupdate`/`ended` listeners. The
  `media !== track` guards make them harmless functionally, but across many
  flips this leaks `HTMLAudioElement` instances and their listeners. The `click`
  element is correctly reused (no leak there). This is a resource/cleanup note,
  outside the two requested concerns; flagged only for awareness.

---

## 4. Concrete verification tasks

These are empirical checks to run in a browser. Serve the folder per the README
(`python3 -m http.server 8765 --bind 127.0.0.1`) and open
http://127.0.0.1:8765/. Each task lists steps and the exact pass criterion.

### V1 — Flip preserves a mid-track position (A ↔ B ↔ A)
1. Press **Play** on Side A. Let it run to a recognizable point (note the
   `m:ss` readout, e.g. `0:30`).
2. Press **Flip**. Confirm the side label flips to "Side B", the track name
   changes, and the readout shows Side B's own offset (likely `0:00` first
   time).
3. Press **Play** on B for a few seconds, then **Flip** back to A.
4. **Pass:** Side A resumes/loads at the ~`0:30` offset it was left at (the
   readout shows ≈ the value from step 1), and Side B's offset is retained for
   the next flip. Repeat the round trip; offsets must not drift or swap.

### V2 — Play-through-the-stop, then Flip, then Play (README flow)
1. Press **Play** on A and let it run to the very end (the click/stop sound).
2. Confirm the status reads `Ended` and the click plays once.
3. Press **Flip** to B, then **Play**.
4. **Pass:** Side B plays from its own start (or its own saved offset). No A
   audio continues or overlaps. The end-click from A stopped when you flipped.

### V3 — Flip mid-track keeps each side's place (README second check)
1. Play A to ~`0:20`, Flip to B, Play B to ~`0:15`, Flip to A.
2. **Pass:** A is at ~`0:20`. Flip to B again: B is at ~`0:15`. Neither side
   reset to zero and neither adopted the other's position.

### V4 — Rapid Play/Pause does not stack audio
1. Press **Play**, then immediately **Pause**, then **Play**, then **Pause**,
   several times in quick succession.
2. **Pass:** Only one audio stream is ever audible at a time; no doubled/lagged
   audio. After settling on Play, the readout advances smoothly from the last
   saved offset (no jump back to 0 unless you had let the side end).

### V5 — Rapid Flip during Starting does not overlap
1. Press **Play** and, before it visibly starts (or immediately as it starts),
   press **Flip**, then **Play** on the new side.
2. **Pass:** No overlap of A and B audio. The abandoned side is silent. The
   mounted side plays from its own offset.

### V6 — Rewind during playback
1. Play A to ~`0:25`, press **Rewind**, then **Play**.
2. **Pass:** Audio restarts from `0:00`. Side B's stored offset (set in V1/V3)
   is unaffected — flip to B and confirm it is still where you left it.

### V7 — Rewind during the Starting phase
1. Press **Play** and press **Rewind** almost simultaneously.
2. **Pass:** No overlap; status ends `Paused` at `0:00`; pressing Play starts
   cleanly from zero. (Optionally confirm in DevTools that no `play()` rejection
   is left unhandled — the code's `.catch` and generation guard should make this
   silent.)

### V8 — Ended → immediate Play (replay)
1. Let Side A play to the end (click plays, status `Ended`).
2. Immediately press **Play**.
3. **Pass:** The click stops, Side A restarts from `0:00`, no click+media
   overlap.

### V9 — Ended → Flip → Play (no click bleed)
1. Let A play to the end (click plays).
2. Immediately **Flip** to B, then **Play**.
3. **Pass:** The A end-click stops on flip; B plays from its offset with no
   click overlap.

### V10 — DevTools cross-check (optional, strong evidence)
1. Open DevTools → Network tab, filter "media". For each flip, confirm a new
   `side-*.wav` request and that no two side audio elements are simultaneously
   in a playing state. Use `document.querySelector` is N/A (audio is in-memory);
   instead, in Console, after rapid flips, confirm no console errors and that
   replayed sides seek to their prior offsets.
2. **Pass:** No unhandled `play()` promise rejection warnings in console; no
   doubled audio across any sequence in V4–V9.

---

## 5. Findings summary

| ID | Concern | Verdict | Detail |
|----|---------|---------|--------|
| A  | Flip preserves both positions | **Pass (by inspection)** | Per-side `positions` map; `pause()` saves the leaving side before `side` flips; `loadSide`→`loadedmetadata`→`seek` restores the arriving side. Rewind/ended paths keep the other side intact. See A.1–A.2 for edge cases, all consistent. |
| B  | No overlapping audio on rapid controls | **Pass (by inspection)** | `media?.pause()` on every swap + `generation`/`media !== track` invalidation + Play early-return = at most one main track playing; shared `click` always `stopClick()`-ed first. See B.2 for traced sequences. |
| O1 | Orphaned Audio elements/listeners on repeated flips | **Minor / out of scope** | Each `loadSide` `new Audio(url)` and never removes the old element or its listeners; guards make it harmless but it leaks over time. Not an overlap or position defect. |

### Blockers
None. Both requested concerns are satisfied by the current logic. The only
follow-up is the optional O1 cleanup (memory/listener hygiene), which does not
affect correctness of flip-position preservation or overlap prevention and is
outside the two requested concerns.

### Recommended next step
Execute V1–V10 in a browser to convert the by-inspection verdict into empirical
evidence before any submission (the README notes retaining genuine `.kiro`
evidence). No code change is required for A or B to pass.

## Rewind sound and reel controls

Codex browser verification addendum. The test used the app's markup, event bindings, transport, and real browser Audio elements with the bundled WAV files. Each control was activated while Side A was playing.

| Control | Position and state | Audio |
| --- | --- | --- |
| Left cassette reel | Paused at 0:00 | Rewind WAV advanced while tape audio was paused |
| Right cassette reel | Paused at 0:00 | Rewind WAV advanced while tape audio was paused |
| Rewind button | Paused at 0:00 | Rewind WAV advanced while tape audio was paused |

Pressing Play during the rewind sound stopped the effect before tape playback resumed in all three cases. The test sampled native media state at command boundaries and during playback. Peak observed active audio sources was one. This measures browser media state, not speaker output.

## Supplied MP3 verification · 4 November 2026 SAST

Codex repeated the real-browser check using DJ's supplied rewind.mp3. Left reel, right reel, and Rewind button each passed. The tape paused before the MP3 advanced, and the display reset to 0:00 Paused. Play interrupted the effect before tape playback resumed. Peak observed active native audio sources was one across these checks.

## Rewind animation browser verification

Both reel holes and the Rewind button passed real-browser checks. During actual effect playback both reel animations ran with reverse direction and advancing animation time. Play stopped the effect, removed the rewind animation, and restored normal forward playback animation. Peak active media count was one. Versioned script and stylesheet URLs were added after the initial check exposed stale cached assets.

## Trimmed effect natural end

Browser checks passed for left reel, right reel, and Rewind. The 2.645-second effect completed naturally, the rewind class cleared, both reel animations disappeared, and the display returned to Paused. Peak active audio sources was one.

## Flip label timing

Codex changed the turnover to two 275ms halves. The outgoing face stays visible until edge-on, then the new side appears from the opposite edge. Browser assertions passed for outgoing label retention, an active turning animation, and incoming label timing. Side A at 0:01 and Side B at 0:02 both restored paused after round trips.

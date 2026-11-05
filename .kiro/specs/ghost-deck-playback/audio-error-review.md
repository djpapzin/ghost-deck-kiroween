# Audio error handling — static review

Reviewed 4 November 2026. Static inspection of `transport.js` (with render callback in `main.js` and animation classes in `deck.css`). No source files were modified.

Scope: media errors after play resolves, stale source events, retry, rewind failure clearing animation, and no overlap.

## Findings

### 1. Media errors after play resolves — correct

The tape `error` listener (transport.js lines 43–49) fires on any media error, including after `play()` has resolved and set `status = 'Playing'`. It guards with `if (media !== track || !track.error) return;`, then increments `generation` (invalidating in-flight `play()` continuations), pauses the track, saves position when `positioned`, calls `stopEffects()` to clear rewind state, sets `status = 'Could not play'`, and calls `update()`. The render callback in `main.js` toggles `deck.classList.toggle('playing', status === 'Playing')`, so the `.playing` CSS class (reel spin animation) is removed when status leaves Playing. Post-start failures are handled.

### 2. Stale source events — correct

All four tape track event listeners guard with `if (media !== track) return;`:
- `loadedmetadata`: checks `media !== track`
- `timeupdate`: checks `media !== track || !positioned || status !== 'Playing'`
- `error`: checks `media !== track || !track.error`
- `ended`: checks `media !== track || !track.ended || !['Starting', 'Playing'].includes(status)`

Each handler captures the local `track` variable from the `loadSide()` closure. When `loadSide()` is called again (flip or retry), `media` is reassigned to the new track, so old handlers bail out. The `rewindSound` `error` and `ended` handlers (lines 98–106) do not use this guard, which is correct: `rewindSound` is a persistent singleton, not replaced per side. They guard with `rewindSound.error` / `rewindSound.ended` instead.

### 3. Retry — correct

`play()` (line 80) reloads the side when `status === 'Could not play'` or `media.error` is truthy:

```javascript
if (status === 'Could not play' || media.error) loadSide();
```

`loadSide()` creates a fresh track and sets `positioned = false`. The fresh track's `loadedmetadata` handler calls `seek(track)` to restore the saved position. The `media.error` check also covers the edge case where the media has errored but the error event has not yet dispatched.

Note: after a tape error, `rewind()` does not reload the errored media — it resets `positions[side] = 0` and plays the rewind effect. `seek(media)` on the errored element is a safe no-op (setting `currentTime` on an errored element does nothing per HTML spec). The actual media reload happens on the next Play via the `media.error` check. This is acceptable: the rewind effect is independent of the tape media, and the position counter is already reset.

### 4. Rewind failure clearing animation — correct

The rewind `error` handler (lines 98–102) sets `rewinding = false` and calls `update()`. The render callback toggles `deck.classList.toggle('rewinding', rewinding)`, removing the `.rewinding` CSS class that drives the reverse spin animation (`.rewinding .reel i { animation: spin .8s linear infinite reverse }` in deck.css). The animation stops.

### 5. No overlap — correct

All transition paths prevent overlap:

- **Rewind → Rewind**: `rewind()` calls `pause()` → `stopEffects()` pauses `rewindSound` and resets `currentTime = 0` (when `readyState > 0`) before the new `rewindSound.play()`. The previous `ended` event does not fire for a paused element.
- **Rewind → Play**: `play()` calls `stopEffects()` first, which pauses/resets `rewindSound` and clears `rewinding`.
- **Play → Rewind**: `rewind()` calls `pause()`, which pauses `media` and calls `stopEffects()`.
- **Tape error → Rewind**: The tape error handler calls `stopEffects()` (clears `rewinding`) before `rewind()` runs. `rewind()` calls `pause()` (safe no-op on errored media).
- **Rewind error → Play**: The rewind error handler sets `rewinding = false`. `play()` calls `stopEffects()` (already cleared).

## Minor observations (not defects)

1. **Redundant rewind failure handlers**: When `rewindSound.play()` fails, both the `error` event handler and the `play().catch()` handler may fire for the same failure. Both set `rewinding = false` and call `update()`. The `error` handler does not increment `generation`, so the `.catch()` handler's `attempt !== generation` check always passes when both fire. This is harmless — `classList.toggle('rewinding', false)` is idempotent — but redundant.

2. **`pause()` on errored media**: `pause()` calls `media.pause()` and reads `media.currentTime` on potentially errored media. `pause()` is a safe no-op on errored elements, and `currentTime` may be unreliable, but the value is immediately overwritten in `rewind()` by `positions[side] = 0`. No functional impact.

## Conclusion

All four concerns are handled correctly in the current `transport.js`. No defects found. The codex-review.md P2 resolution accurately describes the implementation. The two minor observations are harmless redundancies, not bugs.

# Ghost Deck Codex review

Reviewed 4 November 2026 SAST. Independent static review of main.js, transport.js, index.html, deck.css and the three Kiro reviews. Application files were preserved. Prior Codex browser results were read as recorded evidence, rather than repeated during this review.

## Finding

### [P2] Handle media errors after playback has started

Location: transport.js lines 30–49 and 94–98, with the recovery branch at lines 70–72.

The transport handles rejection of play(), but neither the tape nor rewind element has an error event handler. If a source fails after play() has resolved, the browser stops producing audio while the UI remains Playing or Rewinding. Tape Play then immediately returns because the state is still Playing, so retry requires the user to press Pause first. A failed rewind can leave the reels spinning indefinitely because error does not dispatch ended.

Reproduction: allow a long or partially streamed audio source to begin, then cause a network/decode failure during playback. For rewind, cause failure after the effect starts. The expected result is a paused/error state and cleared rewind animation. A deterministic EventTarget probe through the existing makeAudio injection confirmed that dispatching error after successful play leaves Playing, and dispatching error during rewind leaves rewinding=true. This probe establishes missing state handling. It does not emulate browser network behavior.

Suggested fix: listen for error on the current track and rewind effect. Preserve the last usable position, invalidate pending work, pause affected audio, clear rewind state, and render a recoverable error. Guard handlers against retired media. Verify a post-start failure as well as initial load rejection.

## Other observations

No further actionable defect was identified in the current flip cancellation, midpoint face swap, independent side positions, or single-source transport ordering. Reduced-motion and spoken screen-reader behavior remain inspection-only in the supplied evidence. The supplied reverse sample's public-distribution permission is still listed as unverified in audio/CREDITS.md and remains a release prerequisite.

## P2 resolution

Added a guarded error listener to the current tape and a rewind error listener. Tape failure pauses playback, saves a valid position, invalidates pending playback, clears effects, and sets Could not play. Play reloads errored media for retry. Rewind failure pauses the effect and clears the rewind animation flag.

Codex browser regression passed using native Audio elements. After playback began, switching the source to a missing resource generated actual media errors. Tape left Playing and Play retried successfully. Left reel, right reel, and Rewind each stopped both reel animations after the rewind sound failed.

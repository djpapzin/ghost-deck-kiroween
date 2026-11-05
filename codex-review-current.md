# Ghost Deck current Codex review

Reviewed 4 November 2026 SAST. Independent review of the current transport.js, main.js, index.html and deck.css, checked against the earlier Codex and Kiro reviews. Application files were preserved.

## Findings

No actionable correctness findings in the reviewed scope. The previous P2 media-error defect is resolved.

- transport.js lines 40–47 handles errors after playback begins, invalidates pending playback work, preserves position, clears effects and renders a retryable state.
- transport.js lines 81–98 creates fresh tape media on retry and guards asynchronous outcomes against superseded commands.
- transport.js lines 103–113 clears rewind animation state on failure and natural completion. Lines 128–133 support effect retry and guard rejected starts.
- main.js lines 18–44 keeps the outgoing face until edge-on and guards animation completion. Lines 60–67 settle interrupted flips on the current transport side.
- index.html exposes side changes through a live region. deck.css has one effective rewind animation and the reduced-motion override.

## Verification performed in this review

A deterministic EventTarget/native-interface substitute probe exercised the exported createTransport entry point. It passed post-start tape error and retry, retired-track error rejection, distinct A/B positions, rewind failure clearing the flag, rewind retry, and Play interruption with one active source. The probe was run from work/review-current.mjs.

This review did not repeat real-browser or speaker-output tests. The earlier recorded browser results cover native media failure after start, both reel controls and Rewind animation cleanup, side positions and flip interruption. Reduced-motion browser behavior and spoken screen-reader output still lack empirical evidence.

## Readiness limits

No Git repository or PR was identified at the project directory. This is a review of the local source snapshot, without CI or a merge-target comparison. The supplied rewind sample's public reuse permission remains unverified in audio/CREDITS.md. Public hosting, repository/license packaging and the Kiroween demo remain separate release work.

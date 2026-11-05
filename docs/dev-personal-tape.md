# Personal tape — dev scope

One locally selected audio file per side. Read embedded title/artist with a filename / Unknown artist fallback. Display elapsed and total time (unknown duration is --:--). Files stay in the browser; no server upload or persistence. Demo tape can be restored.

Acceptance:
- Picking A or B pauses current playback, resets only that side and lands paused; the other position survives.
- Flip pauses and restores each side independently, keeping the existing midpoint face change.
- Each side displays its own metadata and duration. Untagged/unsupported tags use safe text fallbacks. Replacing a file during pending tag reads cannot restore stale metadata.
- Play, Rewind and reel holes keep existing effect/overlap safeguards. Invalid media reports failure and can be replaced.
- Replaced blob URLs are revoked; no user files are transmitted or saved. Reload restores the built-in tape.
- Keyboard and narrow layouts remain usable. Build includes the bundled tag reader and licence.

After release: multi-song sides, editing tags, persistence, recording and sharing.

No changes to main or live hosting are authorized for this work.

## Verification — 5 November 2026 SAST

- Five Node transport tests pass: independent replacement/positions; retired media and stale tags; 40 mixed replacement/control sequences; demo reset/stale callbacks; media/effect error recovery. Mock peak active source count one.
- Real IAB at localhost:8770: selected generated tagged M4A (Midnight Test / Ghost Deck Tester, total 0:15) and untagged WAV (no-tags / Unknown artist, total 0:12). A at 0:04 and B at 0:07 restored paused after flip. Replacing A reset A and retained B at 0:07.
- Instrumented native Audio during 60 actual button presses (Play, both holes, Rewind, Play, Pause repeated ten times): peak active one, final zero active, no rewind class left. Instrumentation was local-only and removed by reload.
- Delayed first-file tag callback after second-file selection did not restore STALE TITLE / STALE ARTIST. Replacements plus demo reset revoked all six created local URLs. Broken MP3 reported Could not play with --:-- duration; demo restore recovered. No off-origin resource requests recorded.
- At 320 CSS pixels the document width stayed 320 and both file inputs fit. Native labeled file inputs are keyboard focusable. Fresh reload restores demo state. Physical phone testing of this new dev feature and spoken screen-reader output are not claimed.
- Static build includes tag-reader script and its BSD licence. JavaScript syntax and git diff checks pass. main and live hosting were not changed.

## Cassette layout follow-up

DJ requested the upload controls inside each cassette face. Only the visible face’s picker is shown; it changes at the flip midpoint with the labels. Both pickers are disabled while turning, and a newer flip or interruption owns the final face. The large external loader section is removed. Demo tape remains the fresh-page default, with a small Restore demo tape action below the transport.

Review P2 resolved: current flip completion now refreshes title and artist under its generation guard. Two new exact-main.js animation/DOM regression tests cover metadata arriving during the incoming half and superseded flips. Seven tests pass in total. Browser: loaded tagged M4A through Side A’s face picker, flipped and loaded untagged WAV through B, returned to A and saw retained metadata; only the visible face’s picker is enabled after settling. Restore and fresh reload show demo Side A by default. main/live unchanged. Independent re-review has not yet been performed on this follow-up.

## Mixtape appearance follow-up

DJ asked for a more physical homemade mixtape look and an explanation of Type I. Type I was decorative tape-formulation labeling, not an audio mode. Replaced that footer with Ghost Deck / Mixtape. Added a dark molded shell, four decorative screws, cream ruled paper label, handwritten-style local font stack, printed side badge and red/blue label stripes. No behavior change or external font/image dependency. Seven regression tests pass; browser default face and upload placement inspected. This styling follow-up is newer than the independent passing review at 847c1d3 and has not received independent re-review.

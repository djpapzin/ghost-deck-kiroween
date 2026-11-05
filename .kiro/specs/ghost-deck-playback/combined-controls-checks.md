# Combined controls verification

Real Codex browser test passed on feature/flip-sound.
- Toggle starts and pauses playback.
- Flip sound plays while the tape is paused.
- Side A 0:01 and Side B 0:02 both restore correctly.
- Twenty rapid sequences of toggle, Flip and Rewind observed at most one active native audio source.

Design follows Sites skill guidance for accessible, bounded local edits. System font stack, monospace cassette labels, tactile press feedback and a highlighted playback control. Motion feedback is disabled under reduced motion.

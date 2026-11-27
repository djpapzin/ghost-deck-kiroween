# Ghost Deck: judge-facing description and demo

This guide targets the public judging build at `06437868ba836e65bbd10e0ee76bc95ed2a689bf`. It does not identify the currently served Cloudflare revision. [Devpost](https://devpost.com/software/ghost-deck) still embeds the [earlier 2:28 recording](https://www.youtube.com/watch?v=d2dYm-MwEa4). Keep the existing entry and video in place until a replacement is uploaded and verified signed out.

## Replacement description

Ghost Deck brings the cassette ritual into a browser. Play a two-sided tape, or use **Load song** to select one local audio file for the current side. The title and artist appear below the cassette, with a filename fallback when tags are unavailable. Local files stay in the open browser and are not uploaded.

Use **Flip** or click the cassette body to turn it over. The other side arrives paused, and each side remembers where you left it. Press **Rewind** to reset the current side, or open **Inspect** to rotate the cassette without switching playback sides. It is a two-song player, not a multitrack editor.

Kiro IDE reviewed the playback and animation, including a case where Play or Rewind interrupts a flip. The [original review and follow-up](../.kiro/specs/ghost-deck-playback/) document the finding and fix. Codex implemented the changes and ran separate checks.

## Demo verification

1. Run `python3 scripts/build-static.py` and serve `dist/` locally, or verify the signed-out live app before recording against it.
2. Play and flip within the first 15 seconds. Play the second side, then flip back and show the first side paused at its saved time.
3. Show Rewind, Inspect, and the Load song control. Use cleared audio or a muted recording; do not capture third-party streams or uncleared sound effects.
4. Show the interrupted-flip finding in [animation-review.md](../.kiro/specs/ghost-deck-playback/animation-review.md) and the follow-up in [fixes-review.md](../.kiro/specs/ghost-deck-playback/fixes-review.md). Keep the clip under three minutes.
5. Check the intended video link signed out and verify the video and description on the existing submission after any edit. A repository merge does not edit Devpost or deploy Cloudflare Pages.

The [official submission deadline](https://kiroween.devpost.com/rules) is 4 December 2026 at 22:00 UTC, or 5 December at 00:00 SAST.

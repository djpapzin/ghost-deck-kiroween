# Audio provenance and release status

## Rewind sample — released on uploader’s stated terms

DJ supplied `Reverse Sound Effect - Copyright free sound effects.mp3` on 4 November 2026 SAST. The app uses `rewind-trimmed.wav`, a derivative with leading and trailing silence removed. The original MP3 is not tracked in the current tree.

Reference: https://www.youtube.com/watch?v=_g4Wazm3cJc
Uploader: Ibtieee / @ibtieee5207. Published 8 April 2018.

On 5 November 2026, the original YouTube page was inspected in the local browser. Both its title and expanded description call the effect “copyright free”. The description describes reverse tape and comedy-video sound effects. It links to a video editor; a pinned comment links to a sound pack video. No explicit licence or terms granting redistribution in a public source repository were visible in the expanded description. The uploader’s ownership of the underlying recording was not established.

On 5 November 2026 DJ explicitly authorized public use of this supplied sample relying on the uploader’s “copyright free” statement. Release proceeds on that basis with attribution to the source. This records the basis for use; it does not assert public-domain status or independently verified ownership. The sample is excluded from the MIT code licence.

Original user-supplied MP3 SHA-256: `c13c945ff19d4ad2ee06076f3d960e7b20d29738f27a739e33e61847f600352b`.

## Other bundled audio

- `side-a.wav`, `side-b.wav`: melodies generated for the prototype. Released Side A is music-only: the 83,966-frame macOS-generated intro was removed after an exact match to the original intro WAV; the remaining 264,600 PCM frames (12 seconds at 22,050Hz) are unchanged. The cleaned music-only audio was promoted before the 6 November submission and is present in current main/live and the separate public judging snapshot. The intro remains in private engineering history; do not publish that history unchanged. Apple-source finding: https://www.apple.com/legal/sla/docs/macOSTahoe.pdf section2F.
- `click.wav`: generated for the prototype.
- `flip.wav`: synthesized handling/clack effect created during development.

The MIT code licence does not relicense any third-party recording or voice. Record actual grants and attribution here before release.

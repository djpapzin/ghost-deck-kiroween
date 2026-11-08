# Historical public-source cleanup plan

## Superseded status — 8 November 2026

The clean-public-snapshot route below was approved and completed before the 6 November Kiroween submission. The engineering repository remains private; https://github.com/djpapzin/ghost-deck-kiroween is public at submitted snapshot 1e5625f. Released main/live use music-only Side A; main’s 8 November design release is bae16d4. No history rewrite was performed. The public snapshot currently differs from production; see hackathon-status.md for the next alignment steps.

The original proposal below is retained as historical rationale, not current status or authorization.

# Public-source cleanup plan — approval required

Prepared 5 November 2026 SAST. No history rewrite, deletion, visibility change or deployment has been performed. Main and live remain on77e7a63. Dev removes the synthesized intro; this plan is a reviewable proposal.

## Exact asset boundary and verification

The original intro WAV contains83,966 mono16-bit PCM frames at22,050Hz (3.807981859s). Those PCM bytes match the exact prefix of original SideA. Removing only that prefix retains264,600 frames (12s) of music, byte-identical to the original suffix.

- Old file SHA256: 0fcb38d93c89ae8acb3c0271625fca6cd390ac96e92a36173874c4412bdd6cc3
- Old Git blob: 45b5d3be3d00a8155d9b8b34a8aec6f2c03dd1d4
- Clean file SHA256: 65c85c988d8ae471c1f76902ef15a6da154230281e0dffb4f4de6ca7e7ef84c1
- Clean Git blob: 641ebf009944919989bb9926e53e86ef2bfa885f

Dev requests the music-only asset with a fresh version key; main.js and its transport import also have new keys, avoiding playback of the previous cached intro after a future authorized deployment. Eight tests pass; local browser showed12s, successful Play, paused Flip and demo restore. Main/live have not been promoted.

## Recommended option — clean public judging repository

Keep djpapzin/ghost-deck PRIVATE with its existing engineering history. Create a separate public repository such as ghost-deck-kiroween only after DJ approves that destination and publication. This avoids exposing old commits/PR refs and avoids rewriting shared history. It changes the Devpost source URL, not the working app URL.

1. Review/approve the intro-removal source change and identify the exact clean commit/tree.
2. Re-audit the resulting source tree, audio hashes and licence notices. Preserve root .kiro exactly as genuine Kiro evidence, plus current source/run instructions. Do not include .git, old release ZIPs, original intro WAV/AIFF, local test fixtures or chat/session exports.
3. Use a git-archive clean-tree snapshot, not a clone/mirror, as input to a fresh initial commit. An archive has source files but no Git object history. A local candidate ZIP is prepared outside the repo for inspection; it is not a public repository.
4. Before pushing, verify every packaged file, check all expected licences and .kiro, and confirm the old audio hash/blob/prefix does not appear in packaged media. Do not publish private author/account data or rewrite the genuine review text into fabricated provenance.
5. After explicit approval, create the new repo and push the clean initial history only. Read back its public source, licence detection, .kiro and raw audio hash. Confirm no original history/tags/branches or old releases were imported.
6. Update the draft’s GitHub URL and describe the clean public release snapshot honestly. Preserve the old private repo as the engineering record. Separately promote the clean audio to main/live only when DJ authorizes that release, then recheck hosted audio hash and duration.

A new public repo does not fix the already deployed old intro automatically. Publication and production audio are two separate actions requiring their own verification.

## Alternative — keep the current repo URL and rewrite its history

Use only if DJ explicitly chooses history rewriting and accepts changed commit IDs. Do not execute in the canonical main clone or an active shared worktree.

1. Freeze pushes; enumerate all remote heads/tags, open and closed PR refs, releases, attachments and any forks. Retain a protected private backup with a verified ref manifest and agree on rollback ownership. Never upload this backup publicly.
2. In a disposable private mirror, replace the exact old audio blob with the verified clean blob throughout all affected history, rather than deleting unrelated files. Account for every alternate path/hash if additional copies are discovered. Preserve code, genuine .kiro reviews, licences and non-audio assets.
3. Re-scan all resulting reachable objects/commit messages and compare branch trees against intended clean content. Verify zero reachable old blob/file hash/prefix and retained12s clean audio. Keep the old-to-new ref mapping private.
4. Review the full mapping and backup before any targeted force-with-lease updates. Never use an unreviewed blanket mirror force-push; do not delete unrelated branches/tags.
5. Coordinate clone/worktree replacement with collaborators so old refs are not pushed back. Recheck remote heads/tags and public downloadable assets.
6. GitHub PR refs, cached diffs/views, forks and old attachments may retain old objects beyond ordinary branch updates. Contact GitHub Support if needed and obtain an adequate server-side removal/visibility plan before changing the repo public. A successful local scan or force-push alone does not prove those copies are gone.
7. Only after exact remote-ref verification and DJ’s visibility approval make the repo public, then independently read back accessible files/history. Separately authorize and verify the live audio update.

## Decision and ownership

DJ chooses clean public snapshot (recommended) or in-place rewrite. Codex prepares and verifies only the approved route. Until then keep the existing repo private; main and live unchanged. No feature additions are part of this cleanup.

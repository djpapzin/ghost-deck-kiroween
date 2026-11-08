# Ghost Deck repository rules

## Codex review — DJ standing rule, 8 November 2026

Every commit in this repository must receive a Codex code review, including fixes, documentation changes and review-follow-up commits. Request review after each pushed commit and verify the review covers that exact commit SHA. Do not batch unreviewed commits and call a review of only the final head coverage of every earlier commit.

Resolve actionable findings, then obtain a clean review covering the resulting commit. Do not merge, promote or deploy an unreviewed revision or one with unresolved actionable findings. Tests, GitGuardian and the implementing agent’s self-review do not substitute for a Codex review. Record the reviewed SHA and link to review evidence in the PR. If review is unavailable, report that blocker rather than claiming clean review.

This rule does not itself grant merge, deployment, publishing or account-setting authority.

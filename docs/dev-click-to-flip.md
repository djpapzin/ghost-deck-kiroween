# Click cassette to flip — dev only

Scope: clicking the noninteractive cassette body, paper label or decorative shell flips once using the existing transport. The visible Flip button remains the keyboard control.

Acceptance: cassette click pauses and restores per-side positions; clicks on reel buttons or their inner artwork rewind only; upload labels, spans and file inputs open only their own picker and never flip; rapid body/control clicks preserve single audio ownership and a settled current face. Native interactive descendants are excluded by closest(), including label-generated input clicks. No main change or live deployment.

After release: no additional gestures in this change.

Verification (5 November 2026 SAST): eight tests pass, including exact-main.js delegated body click versus interactive descendants. Fresh IAB: clicking title area while playing flips and pauses; clicking left reel inner artwork enters Rewinding without changing B; clicking B upload label span opens its picker and loads B without flipping; A native input also loads A without flipping. Body-click A/B roundtrip restored A at0:04 after B at0:07. Instrumented native Audio during20 scripted rapid body/reel/Play/Pause rounds (80 DOM clicks) peaked at one active source, ended paused with zero active. Instrumentation removed by reload; clean demo preview left open at localhost8770. This feature is not deployed.

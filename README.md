# flowlaps

## Local review hook (optional)

This repo ships a `pre-push` git hook (`.githooks/pre-push`) that runs
[`scrutineer`](https://github.com/dallaskoncir/scrutineer) against any
`.ts`/`.tsx`/`.js`/`.jsx` files a push would introduce.

It is **opt-in and local only** — nothing in the tracked repo activates it
automatically (git does not run hooks from `.githooks/` unless you point
`core.hooksPath` at it yourself), and there is no CI job re-running the same
check. A push from a clone that hasn't activated the hook, or from CI, goes
out unreviewed.

To activate it in your local clone:

```
git config core.hooksPath .githooks
```

`review:local` runs scrutineer with `--provider ollama`, so it needs a
reachable Ollama instance rather than an Anthropic API key. Without one,
the hook will fail and block the push. If a real review can't run, treat
that as a blocked push you need to fix (get Ollama reachable) rather than
skipping it. scrutineer auto-detects which model to use from that
instance (preferring a currently-running one, falling back to whatever's
pulled) — no model configuration needed unless you want to pin one via
`SCRUTINEER_MODEL_OLLAMA`.

If Ollama runs on Windows and you're pushing from WSL, `127.0.0.1` may
resolve to a different (possibly empty or stale) Ollama instance than the
one your Windows terminal talks to. Point `OLLAMA_HOST` at the WSL2
gateway IP instead — find it with `ip route show default` (the `via`
address) — e.g. `export OLLAMA_HOST=172.x.x.1:11434` in your shell
profile. scrutineer will warn on every run when `OLLAMA_HOST` isn't a
loopback address, since it means review content (diffs, AST context) is
leaving the WSL VM.

Each changed file gets reviewed separately, and each review is capped at
180 seconds by default (`SCRUTINEER_TIMEOUT` env var to override). scrutineer
itself now bounds each model call to 120s internally, but the hook's own
timeout remains a backstop in case that's ever insufficient — a multi-file
push can take up to `file_count × timeout` in the worst case before
failing, since each file's timeout is independent.

To bypass the hook for a specific push (e.g. Ollama isn't reachable yet, or
a push that doesn't need review), use `git push --no-verify`.

The hook shells out to the GNU coreutils `timeout` command, which isn't
present by default on macOS/BSD (install via `brew install coreutils`,
which provides `gtimeout`, or add a `timeout` shim on `PATH`).

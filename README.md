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

`scrutineer review` calls out to the Anthropic API to run its review agents,
so it requires `ANTHROPIC_API_KEY` (or `--provider ollama` for a local
model) to be set in your environment — without it, the hook will fail and
block the push. If a real review can't run, treat that as a blocked push
you need to fix (get a key configured) rather than skipping it.

Each changed file gets reviewed separately, and each review is capped at
180 seconds by default (`SCRUTINEER_TIMEOUT` env var to override). This
matters because a misconfigured `scrutineer` (e.g. missing API key) doesn't
always fail fast — it can hang well past reporting its own failure, so the
timeout is what actually bounds the push. A multi-file push can take up to
`file_count × timeout` in the worst case before failing, since each file's
timeout is independent.

To bypass the hook for a specific push (e.g. no API key configured yet, or
a push that doesn't need review), use `git push --no-verify`.

The hook shells out to the GNU coreutils `timeout` command, which isn't
present by default on macOS/BSD (install via `brew install coreutils`,
which provides `gtimeout`, or add a `timeout` shim on `PATH`).

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

To bypass the hook for a specific push (e.g. no API key configured yet, or
a push that doesn't need review), use `git push --no-verify`.

# CLAUDE.md

## Project

Flowlaps is a telemetry analytics and post-session AI coaching dashboard for sim racers who want calm, practical, plain-language feedback after a session instead of constant live coaching.

## Product goals

- Build a portfolio-quality product with strong UX and believable analytics.
- Focus on post-session review, not real-time race coaching.
- Translate telemetry into clear patterns and a short next-practice plan.
- Keep the product calm, approachable, and low-noise.

## Product constraints

- Do not default to hyper-specific coaching like “brake 42% less at 100m.”
- Do not overbuild setup-engineering advice.
- Do not generate ten recommendations at once.
- Prefer broad, useful patterns over fake precision.
- Limit primary focus areas in reports to 3.
- End reports with a short, actionable practice plan.

## Technical constraints

- Next.js App Router
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Node/TypeScript backend logic
- Prisma
- Zod
- Mock data is acceptable early if it speeds up UI and architecture work.

## Build strategy

1. Build the UI with mocked data first.
2. Add Prisma schema and seed data.
3. Add CSV import for one telemetry format.
4. Normalize imported data into domain entities.
5. Compute derived metrics in code.
6. Generate coaching summaries only from structured metrics.
7. Explore SimHub local connector later.

## UX guidance

- Optimize for low cognitive load.
- Prioritize whitespace, grouping, and hierarchy.
- Make charts supportive, not overwhelming.
- Surface the most important issues first.
- Treat empty, loading, and error states as product features.

## Coaching tone

The product should sound like a calm coach, not a robotic telemetry parser.

Good examples:
- You are braking too early overall in the heaviest braking zones.
- You are giving away exit speed by waiting too long to commit to throttle.
- Your pace drops when you start pushing after a clean lap.
- Focus on 2 to 3 corners next session, not the whole lap.

Bad examples:
- Brake 42% less.
- Use the 100m board.
- Turn in 0.12s earlier.
- Increase trail braking by an exact arbitrary amount unless the data and UX justify it.

## Architecture guidance

- Keep analytics logic in pure TypeScript utilities where possible.
- Keep AI generation separated from telemetry parsing.
- Favor maintainable modules over clever abstractions.
- Use clear domain naming.
- Prefer believable MVP behavior over speculative advanced features.

## Definition of done

A feature is not done unless:
- it works with realistic mock or imported data,
- it has loading, empty, and error states,
- it fits the calm coaching philosophy,
- it is responsive,
- and it is readable enough to explain in an interview.

## Git workflow

Use this workflow for every meaningful implementation step:

1. Create a new branch for the step.
2. Make only the scoped changes for that step.
3. Run the relevant local checks before committing.
4. Review the diff for unnecessary noise.
5. Add and commit with a clear message.
6. Push the branch to the remote.
7. Open a pull request. Vercel's GitHub integration deploys a preview automatically on every push to the PR — no manual deploy step needed.
8. Run `pnpm run review:pr <PR number>` to post the scrutineer code-review + security-audit pass as a PR comment (see Code Review Workflow below).
9. Stop and wait for review feedback before continuing.

## Collaboration loop

After opening a pull request:
- Do not keep building the next step automatically.
- Wait for human review.
- Assume the reviewer may ask questions, request changes, or leave code comments.
- When review feedback arrives, switch into review-response mode.
- Read each comment carefully, explain the issue if needed, then make only the requested updates.
- Commit follow-up changes to the same branch unless explicitly asked to start a new branch.
- Push updates and notify that the PR is ready for re-review.

## Branching rules

- Use one branch per task or step.
- Keep branches small and reviewable.
- Do not mix unrelated work into the same branch.
- Do not perform drive-by refactors unless explicitly requested.
- If a task grows too large, propose splitting it into smaller PRs.

## Commit guidance

- Use clear, specific commit messages.
- Prefer small, understandable commits over one giant commit.
- Before committing, summarize what changed and why.

## Pull request guidance

Each PR should include:
- what was implemented,
- why it was implemented,
- major files changed,
- any open questions,
- any tradeoffs or follow-ups.

## Expected assistant behavior

When helping with implementation:
- Propose the next small step.
- Name the branch.
- Describe the files likely to change.
- Suggest checks to run.
- After code changes, remind that the next actions are add, commit, push, and PR.
- After PR creation, stop and wait for review feedback.
- When asked to review comments, focus only on the feedback in the PR and the changes needed to address it.

## Agent skills policy

Use Addy Osmani agent skills selectively. Do not load all skills at once.

### Default skills for this project

- spec-driven-development
- planning-and-task-breakdown
- incremental-implementation
- test-driven-development
- code-review-and-quality
- git-workflow-and-versioning

### Use when relevant

- frontend-ui-engineering for UI, component, accessibility, responsive layout, and design-system-heavy work
- api-and-interface-design for route design, import contracts, schema boundaries, and service interfaces
- source-driven-development for SimHub research, telemetry formats, CSV parsing assumptions, and external tool integration details
- debugging-and-error-recovery for failed imports, broken charts, parsing bugs, and unexpected behavior
- browser-testing-with-devtools for validating dashboard flows, comparison screens, responsiveness, and browser-side issues
- security-and-hardening for file uploads, input validation, and external integration boundaries
- observability-and-instrumentation for import pipeline logs, metrics, tracing, and error visibility
- documentation-and-adrs for architectural decisions worth preserving and explaining later in interviews

### Workflow rule

For each branch or PR step, activate only the smallest relevant set of skills.

### Suggested branch-to-skill mapping

- Product or UX planning branch: spec-driven-development, planning-and-task-breakdown
- UI implementation branch: frontend-ui-engineering, incremental-implementation, code-review-and-quality
- Import pipeline branch: api-and-interface-design, source-driven-development, test-driven-development
- Bugfix branch: debugging-and-error-recovery, browser-testing-with-devtools
- PR preparation branch or final review pass: code-review-and-quality, git-workflow-and-versioning

## Code Review Workflow

For significant changes, use `scrutineer` (`@flowlaps/scrutineer`, this project's own review CLI) as the independent review gate — not a dispatched Claude subagent and not a parallel chat window:

- **Strict Role Separation**: You act as my co-author (Claude) for writing code, committing, and opening PRs. The GitHub account `flowlaps-ai-reviewer` is strictly used as an independent reviewer, and only `scrutineer` posts as that account — never a Claude subagent role-playing as reviewer. Two different Claude sessions independently deciding to "act as the reviewer" produces duplicate, redundant reviews on the same commit; `scrutineer` is the single source of truth for independent review feedback.
- **No pre-push hook**: There is no automatic git hook running scrutineer before push. Every PR gets a review by explicitly running `review:pr` (below) right after opening it — this is the review of record, not a fast/best-effort local pass.
- **PR-level review**: Run `pnpm run review:pr <PR number>` (no `--` separator — pnpm inserts a literal `--` that breaks scrutineer's arg parsing, unlike plain npm) to post a code-review + security-audit pass as a comment on the PR, authenticated as `flowlaps-ai-reviewer`. Defaults to `--provider anthropic` (needs `ANTHROPIC_API_KEY`) for a meaningful review from the stronger model; append `--provider ollama` only if you deliberately want an air-gapped pass instead.
- **Optional manual local check**: `pnpm run review:local` (wraps `scrutineer review --diff origin/main --provider ollama`) is still available to run by hand for a fast, air-gapped sanity check before opening a PR — it's just no longer wired to any git hook.
- **Bot Token Usage**: Export `GITHUB_TOKEN="$AI_BOT_GITHUB_TOKEN"` (from `.env.local`) before running the PR-level review, so it authenticates as `flowlaps-ai-reviewer` rather than whatever account the ambient `gh auth` session belongs to. This is `scrutineer`'s own env var name (verified in its source, `dist/index.js`) — not `GH_TOKEN`, which is the `gh` CLI's convention and does nothing for `scrutineer` itself.
- **Review Scope**: `scrutineer` runs its own `code-reviewer` and `security-auditor` personas per changed file — no need to separately specify a checklist.
- **Resolution**: Review findings and fix at least all Critical items and all Major items.
- **Wrap-up**: Only after those are addressed:
   - commit any follow-up changes to the same branch
   - push
   - mark the PR as ready for re-review

## Self-Correcting Memory
- Before exiting a session, write a brief, 1-sentence bullet point to `/.claude/memory/corrections.md` documenting any architectural mistakes, syntax errors, or workflow violations you made that I had to manually correct.
- Always read `.claude/memory/corrections.md` at the start of every session to prevent repeating past mistakes.

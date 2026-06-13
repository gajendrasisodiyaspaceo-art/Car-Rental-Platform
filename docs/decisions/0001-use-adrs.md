# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-13

## Context

We need a lightweight, durable way to capture significant technical decisions (and why they were made) so
the team — and Claude — can understand the reasoning later without archaeology through git history.

## Decision

Use **Architecture Decision Records (ADRs)**. Each significant, hard-to-reverse decision gets one markdown
file in `docs/decisions/`, numbered sequentially (`0002-...md`, `0003-...md`).

Use this format for each ADR:

```
# N. <short title>

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD

## Context
What forces are at play, what problem we're solving.

## Decision
What we decided to do.

## Consequences
What becomes easier or harder as a result (trade-offs, follow-ups).
```

## Consequences

- Decisions are discoverable and explain the "why", not just the "what".
- Small per-decision overhead; skip ADRs for trivial/reversible choices.
- Superseding a decision means a new ADR that references the old one (don't delete history).

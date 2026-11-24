---
title: "Zero-Downtime PostgreSQL Migrations in Production"
template: "Technical Deep Dive"
tone: "Technical"
length: "Medium"
version: v2
updated: "2026-11-24T10:00:00.000Z"
---

# Zero-Downtime PostgreSQL Migrations in Production

Schema changes are one of the fastest ways to take down a healthy service. A single `ALTER TABLE` that acquires an `ACCESS EXCLUSIVE` lock can stall every incoming query until the connection pool saturates.

## The Expand-and-Contract Pattern

1. **Expand**: Add the new column as nullable.
2. **Backfill**: Copy data in bounded batches (5,000 rows per transaction).
3. **Contract**: Switch reads, remove old writes, and drop the deprecated column in a follow-up release.

## Guardrails Worth Automating

Always set `lock_timeout = '2s'` and `statement_timeout = '10s'` at the top of every migration script, and pair index creation with `CREATE INDEX CONCURRENTLY`.

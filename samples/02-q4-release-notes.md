---
title: "DraftFlow 1.4: Immutable Version Snapshots and Markdown Export"
template: "Product Release Note"
tone: "Direct"
length: "Short"
version: v2
updated: "2026-11-24T11:30:00.000Z"
---

# DraftFlow 1.4: Immutable Version Snapshots and Markdown Export

## Summary

Version 1.4 introduces append-only version history for every draft and one-click export to Markdown, HTML, and plain text.

## What Changed

- **Version Snapshots**: Every generation, inline revision, and manual save records a numbered snapshot (`v1`, `v2`, `v3`).
- **Safe Restore**: Restoring an earlier version appends a new snapshot rather than overwriting recent edits.
- **Structured Export**: Exported Markdown files include YAML frontmatter with title, template, tone, and ISO date.

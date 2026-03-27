---
name: doctor
description: "Run a comprehensive integrity audit of the TA-ACM candidate pipeline. Use this skill whenever the user says 'run the doctor', 'doctor', 'audit the pipeline', 'check everything', 'health check', 'integrity check', or after making ANY change to any pipeline file (JD files, Output_Cleanup.md, Orchestrator, URL Extractor, etc.). Also trigger when the user asks 'is everything consistent', 'did I break anything', 'validate the pipeline', or 'check for bugs'. This is the master diagnostic — it dynamically discovers all active files, cross-references schemas across all roles, simulates agent execution against every JD, and programmatically verifies all output xlsx files."
---

# The Doctor — TA-ACM Pipeline Integrity Audit

Read the full Doctor prompt at `_Doctor.md` in the TA-ACM root directory, then execute every phase described in it. Do not skip phases, do not summarize early, and do not make changes — diagnose only.

## Quick Reference

The Doctor audit has 7 phases:

0. **Discover & Load** — Scan directory, classify files, read all active files
1. **Schema** — Cross-reference column schemas, weights, formulas across all JD files and every agent that references them
2. **Instructions** — Verify cross-file references, behavioral contracts, dead references
3. **Logic** — Simulate execution against every JD/role, test edge cases
4. **Output Files** — Programmatically verify all xlsx files: scoring math, duplicates, structural health
5. **Role Consistency** — Verify what must be identical vs. different across all roles
6. **Flowchart** — Check SVG accuracy against current pipeline
7. **Maintenance** — Verify checklist completeness

## How to invoke

Read `_Doctor.md` fully, then follow its instructions exactly. Produce the structured report at the end.

# Assessment Task: Build a Tiny CEDX Agent Fleet
**CASE_ID: CEDX-55BBED**

## Objective
Build a complete, production-quality, compliant multi-agent system representing a secure workflow ledger. The system processes transaction packets, applies automated calculations, audits correctness, and applies regulatory approvals.

## Multi-Agent Specification
The multi-agent fleet must consist of distinct, independent, specialized nodes communicating via typed contracts:

1. **Orchestrator Agent**: Aggregates the raw packet, plans the routing pipeline, delegates tasks, and activates compliance triggers if constraints require.
2. **Worker Agent**: Performs calculations, environmental lifecycle impact offsets, and structured summaries.
3. **Verifier Agent**: Audits math accuracy and schema parameters, validating the packet state.
4. **Compliance Approver Agent** (Conditional Threshold Node): Triggered when transaction value exceeds **$33,000**. Signs off on regulatory clearance.
5. **Delivery Agent**: Collects signatures, closes the block, and locks down the final immutable SHA-256 ledger checksum.

## Compliance Amendment
- Second Approver Role: `compliance`
- Trigger Threshold: **$33,000**
- Vetting Approval Chain (whenever value exceeds 33,000):
  `Worker Agent` → `Verifier Agent` → `Compliance Approver Agent` → `Delivery Agent`.

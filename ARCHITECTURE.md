# System Architecture: CEDX Multi-Agent Fleet
**CASE_ID: CEDX-55BBED**

This document details the multi-agent system design, contract communication, and audit verification architecture.

---

## 1. System Topology
The system operates as a full-stack web application. The React frontend presents a visual cockpit of the running fleet, while the Express backend acts as the secure execution engine.

```
                   [ React Client Workstation ]
                                |
                  (HTTP API: /api/fleet/run)
                                |
                                v
                    [ Express Fleet Server ]
                                |
     +--------------------------+--------------------------+
     |                                                     |
     v                                                     v
[ Gemini API (gemini-3.5-flash) ]               [ Crypto Signatures Engine ]
     |                                                     |
     v                                                     v
(Natural Language Reasoning)                      (SHA-256 Ledger Seals)
                                |
                                v
                     [ verify_audit.py ]
                                |
                                v
                     [ Assets: audit.json ]
```

---

## 2. Agent Roles & Specifications
Each agent is structured as an independent module with its own contract and specific output responsibilities:

1. **Orchestrator Agent**: Inspected incoming transaction, computes pipeline routes, delegates tasks, and asserts threshold triggers.
2. **Worker Agent**: Processes domain calculations (offsets, equivalents) depending on the transaction category.
3. **Verifier Agent**: Audits calculation accuracy, verifies constraints, and performs mathematical validation.
4. **Compliance Approver Agent** (Conditional): Activated for high-value transactions (> $33,000) to audit greenwashing policies and register regulatory approvals.
5. **Delivery Agent**: Aggregates all steps, compiles final receipts, and signs the completed delivery block.

---

## 3. Cryptographic Trust Engine
Each completed agent stage appends a cryptographic sign-seal to the audit log:
$$\text{Signature} = \text{SHA256}(\text{AgentName} \parallel \text{Timestamp} \parallel \text{Payload} \parallel \text{CaseID})$$

The final log is bundled into a structured JSON file and signed with a unified integrity checksum, assuring tamper-proof record trails.

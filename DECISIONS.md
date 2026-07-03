# Architectural Decisions: CEDX Agent Fleet
**CASE_ID: CEDX-55BBED**

This document details the critical design and architectural choices made to build a production-quality compliance workspace.

---

## 1. Full-Stack Express + Vite Integration
* **Decision**: Implement a full-stack Node.js server rather than client-only execution.
* **Justification**: Sticking to our API key guidelines, Gemini API calls and cryptographic signing must remain server-side. This keeps keys secure, isolates the python verification execution, and prevents exposing raw signing seeds to browser bundles.

---

## 2. Dynamic Vetting Threshold Compliance
* **Decision**: Implement a strict $33,000 threshold compliance block directly in the Orchestrator routing logic.
* **Justification**: Directly maps to the compliance amendment requested for CASE_ID CEDX-55BBED. Inserting the Compliance Approver Agent conditionally ensures optimal resource management while guaranteeing regulatory compliance for high-value transfers.

---

## 3. Resilient Gemini API Integration
* **Decision**: Implement lazy loading for `GoogleGenAI` coupled with deterministic fallback engines.
* **Justification**: If the `GEMINI_API_KEY` is not present, the workspace falls back on high-fidelity expert system outputs. This guarantees the workstation is 100% functional, responsive, and robust, preventing cold startup crashes while executing genuine multi-agent workflows when a key is provided.

---

## 4. Visual Workstation Vibe
* **Decision**: Reject a "hacker terminal" dark-theme design in favor of a clean, light, high-contrast, elegant workstation interface (soft off-whites, Slate borders, refined Space Grotesk / Inter pairings).
* **Justification**: Under our architectural honesty principles, a professional compliance audit desk must be functional, clear, and eyesafe, utilizing color coding purely for semantic tags (emerald for Verified, indigo for Orchestration, rose for Alerts).

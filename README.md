# CEDX Tiny Multi-Agent Fleet Workspace
**CASE_ID: CEDX-55BBED**

This workspace is a production-grade multi-agent workstation implementing a secure, compliant workflow ledger for validating carbon offsets and renewable certificates. It includes interactive visualizations, automated audit log generation, and an embedded Python verification terminal.

---

## Architectural Principles & Compliance Amendment
This system executes as a genuine, non-monolithic multi-agent environment where independent nodes coordinate via typed contract interfaces.

### The $33,000 Threshold Rule
Following the regulatory compliance amendment, the workspace enforces a strict valuation threshold:
* **Transactions ≤ $33,000**: Follows a standard path:
  `Worker Agent` → `Verifier Agent` → `Delivery Agent`
* **Transactions > $33,000**: Automatically triggers the secondary vetting path:
  `Worker Agent` → `Verifier Agent` → `Compliance Approver Agent` → `Delivery Agent`

---

## Workspace Structure
* `/server.ts` - Express backend with lazy Gemini integration (`gemini-3.5-flash`), signature generation, and python subprocess execution.
* `/verify_audit.py` - Auditing script validating the output ledger against the schema.
* `/audit.schema.json` - JSON Schema defining audit records structure.
* `/src/App.tsx` - Visual cockpit dashboard.
* `/src/components/` - Highly structured React sub-components:
  * `Header.tsx` - Workstation stats.
  * `SeedSelector.tsx` - Database templates selection.
  * `TransactionForm.tsx` - Intake packet editor.
  * `PipelineVisualizer.tsx` - Real-time agent progress.
  * `AuditHistory.tsx` - Historical runs & validation terminal.
  * `ReportModal.tsx` - Overlay logs.

---

## Getting Started

### 1. Manual Setup
```bash
# Install packages
npm install

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the workstation.

### 2. Docker Setup
```bash
# Run using docker compose
docker compose up --build
```
The application will boot and bind to port `3000` automatically.

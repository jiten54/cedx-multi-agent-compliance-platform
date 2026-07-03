# CEDX Multi-Agent Fleet Kit
**CASE_ID: CEDX-55BBED**

This kit represents a compliant multi-agent workstation for validating CEDX carbon offsets and renewable ledger transactions.

## Workspace Tree
* `/server.ts` - Express backend hosting the cooperative agent pipelines, signing engine, and python test triggers.
* `/verify_audit.py` - Compliance script validating `audit.json` against structured rules.
* `/audit.schema.json` - Schema definitions for transaction logs.
* `/src/App.tsx` - Workspace cockpit UI.
* `/src/components/` - Sub-components isolating display parts.
* `/seed/transactions.json` - Initial Approved Ledger Data.

## Core Operations
Execute operations from the command line using our Makefile:
* `make init` - Load dependencies.
* `make dev` - Launch development workspace on port 3000.
* `make verify` - Verify the audit JSON.
* `make docker-up` - Launch full suite inside Docker.

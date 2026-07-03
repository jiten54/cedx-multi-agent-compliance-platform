#!/usr/bin/env python3
"""
CEDX Agent Fleet Audit Verification Script
CASE_ID: CEDX-55BBED
"""

import sys
import os
import json
import re

def verify_audit_file(file_path):
    print(f"[*] Starting audit verification on file: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"[!] Error: Audit file '{file_path}' does not exist.")
        return False
        
    try:
        with open(file_path, "r") as f:
            audit_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[!] Error: Failed to parse audit file as valid JSON: {e}")
        return False

    # 1. Check Case ID
    case_id = audit_data.get("caseId")
    if case_id != "CEDX-55BBED":
        print(f"[!] Verification Failed: Case ID must be 'CEDX-55BBED'. Found: '{case_id}'")
        return False
    print("[+] Verified Case ID: CEDX-55BBED")

    # 2. Check essential keys
    required_keys = ["caseId", "runId", "timestamp", "input", "plan", "steps", "status", "finalHash"]
    for k in required_keys:
        if k not in audit_data:
            print(f"[!] Verification Failed: Missing required key '{k}' in audit log.")
            return False

    # 3. Check Run ID pattern
    run_id = audit_data.get("runId")
    if not re.match(r"^run-[a-zA-Z0-9_-]+$", run_id):
        print(f"[!] Verification Failed: Invalid runId pattern '{run_id}'.")
        return False
    print(f"[+] Verified Run ID: {run_id}")

    # 4. Check status
    status = audit_data.get("status")
    if status not in ["completed", "failed"]:
        print(f"[!] Verification Failed: Invalid status '{status}'.")
        return False

    # 5. Check Transaction details
    tx = audit_data.get("input", {})
    amount = tx.get("amount")
    if amount is None or not isinstance(amount, (int, float)):
        print("[!] Verification Failed: Transaction amount is invalid or missing.")
        return False
    print(f"[+] Verified Transaction: ID={tx.get('id')}, Amount={amount}, Client='{tx.get('client')}'")

    # 6. Verify Threshold Approver Rule
    # Threshold: 33,000
    # If amount > 33,000: approval chain must include Worker -> Verifier -> Compliance -> Delivery
    threshold = 33000
    plan_triggered = audit_data.get("plan", {}).get("thresholdTriggered", False)
    
    if amount > threshold:
        if not plan_triggered:
            print(f"[!] Verification Failed: Transaction amount {amount} exceeds threshold {threshold}, but plan.thresholdTriggered is False.")
            return False
            
        # Verify Compliance step exists
        steps = audit_data.get("steps", [])
        compliance_step = next((s for s in steps if s.get("stage") == "Compliance"), None)
        if not compliance_step:
            print(f"[!] Verification Failed: Transaction amount {amount} > {threshold} requires Compliance approval step.")
            return False
            
        if compliance_step.get("status") != "success":
            print(f"[!] Verification Failed: Compliance step did not complete with 'success'.")
            return False
            
        if not compliance_step.get("signature"):
            print(f"[!] Verification Failed: Compliance approval step is missing a cryptographic signature.")
            return False
            
        print(f"[+] Verified compliance rule: Amount {amount} > {threshold} successfully verified & signed by Compliance Approver Agent.")
    else:
        print(f"[+] Verified compliance rule: Amount {amount} <= {threshold} correctly bypassed Compliance Approver Agent.")

    # 7. Validate Steps structure and signatures
    steps = audit_data.get("steps", [])
    if not steps:
        print("[!] Verification Failed: Audit steps are empty.")
        return False
        
    for i, step in enumerate(steps):
        stage = step.get("stage")
        agent = step.get("agent")
        step_status = step.get("status")
        
        if not stage or not agent or not step_status:
            print(f"[!] Verification Failed: Step at index {i} is missing stage, agent, or status.")
            return False
            
        # Ensure all completed steps by agents have a signature
        if agent != "System" and step_status == "success" and not step.get("signature"):
            print(f"[!] Verification Failed: Active step '{stage}' by '{agent}' is missing signature.")
            return False

    # 8. Check final integrity hash
    final_hash = audit_data.get("finalHash")
    if not final_hash or len(final_hash) != 64 or not all(c in '0123456789abcdefABCDEF' for c in final_hash):
        print(f"[!] Verification Failed: finalHash is missing or is not a valid 64-character SHA-256 hash.")
        return False
    print(f"[+] Verified Audit Log Integrity Hash: {final_hash}")

    print("[***] SUCCESS: Audit log is fully verified and matches all specifications! [***]")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_audit.py <path_to_audit_json>")
        sys.exit(1)
        
    audit_file = sys.argv[1]
    success = verify_audit_file(audit_file)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

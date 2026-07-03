/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEDXTransaction, AgentName, ExecutionPlan } from "../types";

export class OrchestratorAgent {
  private threshold = 33000;

  public execute(runId: string, transaction: CEDXTransaction): ExecutionPlan {
    const requiresCompliance = transaction.amount > this.threshold;
    
    const plan: ExecutionPlan = {
      runId,
      stages: requiresCompliance 
        ? ["Intake", "Orchestration", "Assembly", "Review", "Compliance", "Delivery"]
        : ["Intake", "Orchestration", "Assembly", "Review", "Delivery"],
      steps: [
        { agent: AgentName.WORKER, purpose: "Compile calculations and reports", required: true },
        { agent: AgentName.VERIFIER, purpose: "Audit mathematics and schemas", required: true },
        { agent: AgentName.COMPLIANCE, purpose: "Enforce regulatory threshold compliance approvals", required: requiresCompliance },
        { agent: AgentName.DELIVERY, purpose: "Consolidate, sign, and close packet", required: true }
      ],
      thresholdTriggered: requiresCompliance,
      assignedWorkers: {
        assembler: "Worker Agent Alpha",
        reviewer: "Verifier Agent Beta",
        complianceApprover: requiresCompliance ? "Compliance Approver Agent Gamma" : "None",
        deliveryOfficer: "Delivery Agent Epsilon"
      }
    };

    return plan;
  }
}

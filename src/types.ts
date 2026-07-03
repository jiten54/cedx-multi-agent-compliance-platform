/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CEDXTransaction {
  id: string;
  client: string;
  amount: number;
  category: "Carbon Offset" | "Energy Credit" | "Renewable Certificate" | "Waste Management";
  description: string;
  timestamp: string;
  notes?: string;
}

export enum AgentName {
  ORCHESTRATOR = "Orchestrator Agent",
  WORKER = "Worker Agent",
  VERIFIER = "Verifier Agent",
  COMPLIANCE = "Compliance Approver Agent",
  DELIVERY = "Delivery Agent",
}

export interface ExecutionPlan {
  runId: string;
  stages: string[];
  steps: {
    agent: AgentName;
    purpose: string;
    required: boolean;
  }[];
  thresholdTriggered: boolean;
  assignedWorkers: Record<string, string>;
}

export interface AgentResponse {
  agent: AgentName;
  status: "success" | "warning" | "failed";
  timestamp: string;
  output: string; // Markdown summary of action
  data: any;      // Typed payload returned
  signature: string; // Cryptographic-like SHA-256 seal
}

export interface AuditStep {
  stage: "Intake" | "Orchestration" | "Assembly" | "Review" | "Compliance" | "Delivery";
  agent: AgentName | "System";
  action: string;
  timestamp: string;
  status: "success" | "warning" | "failed";
  data: any;
  signature?: string;
}

export interface AuditTrail {
  caseId: string; // CEDX-55BBED
  runId: string;
  timestamp: string;
  input: CEDXTransaction;
  plan: ExecutionPlan;
  steps: AuditStep[];
  status: "completed" | "failed";
  deliveryPayload?: {
    receiptId: string;
    deliveredAt: string;
    recipient: string;
    amount: number;
    digest: string;
    complianceSigned: boolean;
  };
  finalHash: string;
}

export interface SeedData {
  transactions: CEDXTransaction[];
}

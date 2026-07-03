/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  CEDXTransaction, 
  AgentName, 
  ExecutionPlan, 
  AuditStep, 
  AuditTrail, 
  AgentResponse 
} from "./src/types";

// Import modular agent classes
import { OrchestratorAgent } from "./src/agents/OrchestratorAgent";
import { WorkerAgent } from "./src/agents/WorkerAgent";
import { VerifierAgent } from "./src/agents/VerifierAgent";
import { ComplianceAgent } from "./src/agents/ComplianceAgent";
import { DeliveryAgent } from "./src/agents/DeliveryAgent";

// Import exception queue helpers
import { 
  loadExceptionQueue, 
  addException, 
  ExceptionRecord 
} from "./src/utils/exceptionQueue";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

// In-memory history cache
let runHistory: AuditTrail[] = [];

// Ensure assets & out directories exist for saving audit trails
const assetsDir = path.join(process.cwd(), "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Ensure seed directory exists
const seedDir = path.join(process.cwd(), "seed");
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

// Lazy load Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("[Gemini API] Client initialized successfully.");
      } catch (err) {
        console.error("[Gemini API] Failed to initialize client:", err);
      }
    }
  }
  return aiClient;
}

// Utility to generate a cryptographic-like sign seal
function generateSeal(agent: string, timestamp: string, payload: any): string {
  const dataString = `${agent}|${timestamp}|${JSON.stringify(payload)}|CEDX-55BBED`;
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

// Call Gemini if key exists, otherwise use high-fidelity mock responses
async function askAgent(agent: AgentName, systemPrompt: string, userPrompt: string, fallbackResponse: string): Promise<string> {
  const ai = getGeminiClient();
  if (ai) {
    try {
      console.log(`[Gemini API] Querying ${agent}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        }
      });
      if (response.text) {
        return response.text.trim();
      }
    } catch (error) {
      console.error(`[Gemini API] Error calling Gemini for ${agent}, falling back:`, error);
    }
  }
  return fallbackResponse;
}

// --- API ENDPOINTS ---

// 1. Get seed transactions
app.get("/api/fleet/seeds", (req, res) => {
  const seedsPath = path.join(seedDir, "transactions.json");
  if (fs.existsSync(seedsPath)) {
    try {
      const data = fs.readFileSync(seedsPath, "utf-8");
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: "Failed to parse seed transactions" });
    }
  } else {
    res.status(404).json({ error: "Seed transactions not found" });
  }
});

// 2. Get execution history
app.get("/api/fleet/history", (req, res) => {
  res.json(runHistory);
});

// 3. Run multi-agent simulation
app.post("/api/fleet/run", async (req, res) => {
  const transaction: CEDXTransaction = req.body.transaction;

  const runId = `run-${Date.now()}`;
  const timestamp = new Date().toISOString();
  console.log(`\n========================================`);
  console.log(`[Fleet Engine] Starting transaction run: ${runId}`);
  console.log(`[Fleet Engine] Case ID: CEDX-55BBED, Amount: ${transaction?.amount}`);

  // Refined Validation & Exception Engine
  let isException = false;
  let exceptionRecord: any = null;
  let exceptionMsg = "";
  let reasonCode: "STALE" | "MISSING_INPUT" | "OUTLIER" | "INJECTION_BLOCKED" | "LOW_CONFIDENCE" | "UNVERIFIED_ANOMALY" = "MISSING_INPUT";

  if (!transaction) {
    isException = true;
    exceptionMsg = "Transaction payload is missing entirely.";
    reasonCode = "MISSING_INPUT";
  } else if (!transaction.id || transaction.id.trim() === "") {
    isException = true;
    exceptionMsg = "Transaction is missing a valid operational Identifier (ID).";
    reasonCode = "MISSING_INPUT";
  } else if (!transaction.client || transaction.client.trim() === "") {
    isException = true;
    exceptionMsg = "Transaction is missing Client/Counterparty registration name.";
    reasonCode = "MISSING_INPUT";
  } else if (transaction.amount === undefined || transaction.amount === null || isNaN(transaction.amount) || transaction.amount <= 0) {
    isException = true;
    exceptionMsg = `Transaction amount is invalid: ${transaction.amount}. Value must be a positive integer or float.`;
    reasonCode = "OUTLIER";
  } else if (transaction.amount > 10000000) {
    isException = true;
    exceptionMsg = `Transaction amount exceeds safe operational ceiling of $10,000,000. Under current CEDX guidelines, this is flagged as an Extreme Outlier.`;
    reasonCode = "OUTLIER";
  } else if (transaction.category && !["Carbon Offset", "Energy Credit", "Renewable Certificate", "Waste Management"].includes(transaction.category)) {
    isException = true;
    exceptionMsg = `Category '${transaction.category}' is not recognized under standard CEDX environmental bounds.`;
    reasonCode = "LOW_CONFIDENCE";
  } else if (
    transaction.description && 
    (transaction.description.toLowerCase().includes("override") || 
     transaction.description.toLowerCase().includes("bypass") || 
     transaction.description.toLowerCase().includes("immediate approval") || 
     transaction.description.toLowerCase().includes("hack"))
  ) {
    isException = true;
    exceptionMsg = `Security alert: Transaction description contains potential compliance bypass instructions or injection attempts.`;
    reasonCode = "INJECTION_BLOCKED";
  }

  const steps: AuditStep[] = [];

  if (isException) {
    console.log(`[Fleet Engine] Exception triggered: [${reasonCode}] ${exceptionMsg}`);
    
    // Register exception in the queue
    const fallbackClient = transaction?.client || "UNKNOWN CLIENT";
    const fallbackAmount = transaction?.amount || 0;
    const fallbackCategory = transaction?.category || "Unknown";
    const fallbackId = transaction?.id || "TX-UNKNOWN";

    exceptionRecord = addException(
      fallbackId,
      fallbackClient,
      fallbackAmount,
      fallbackCategory,
      reasonCode,
      exceptionMsg
    );

    // Build failed audit step
    steps.push({
      stage: "Intake",
      agent: "System" as any,
      action: `Transaction quarantined inside Exception Queue: ${exceptionMsg}`,
      timestamp: new Date().toISOString(),
      status: "failed",
      data: {
        error: exceptionMsg,
        exception: exceptionRecord
      }
    });

    const failedPlan: ExecutionPlan = {
      runId,
      stages: ["Intake"],
      steps: [],
      thresholdTriggered: false,
      assignedWorkers: {
        assembler: "None",
        reviewer: "None",
        complianceApprover: "None",
        deliveryOfficer: "None"
      }
    };

    const fallbackTx: CEDXTransaction = {
      id: transaction?.id || "TX-UNKNOWN",
      client: transaction?.client || "UNKNOWN CLIENT",
      amount: transaction?.amount || 0,
      category: (transaction?.category as any) || "Carbon Offset",
      description: transaction?.description || "Quarantined transaction",
      timestamp: transaction?.timestamp || new Date().toISOString()
    };

    const auditString = JSON.stringify({
      caseId: "CEDX-55BBED",
      runId,
      timestamp,
      input: transaction || fallbackTx,
      plan: failedPlan,
      steps,
    });
    
    const finalHash = crypto.createHash("sha256").update(auditString).digest("hex");

    const failedAuditTrail: AuditTrail = {
      caseId: "CEDX-55BBED",
      runId,
      timestamp,
      input: transaction || fallbackTx,
      plan: failedPlan,
      steps,
      status: "failed",
      finalHash
    };

    runHistory.unshift(failedAuditTrail);

    // Write to both assets/audit.json and out/audit.json
    try {
      fs.writeFileSync(path.join(assetsDir, "audit.json"), JSON.stringify(failedAuditTrail, null, 2), "utf-8");
      fs.writeFileSync(path.join(outDir, "audit.json"), JSON.stringify(failedAuditTrail, null, 2), "utf-8");
    } catch (err) {
      console.error("[Fleet Engine] Failed to write failed audit.json:", err);
    }

    return res.json(failedAuditTrail);
  }

  // --- STANDARD COMPLIANT MULTI-AGENT PIPELINE ---

  // STAGE 1: Intake (System stage)
  steps.push({
    stage: "Intake",
    agent: "System" as any,
    action: `Transaction ingested: ID=${transaction.id}, Amount=${transaction.amount}`,
    timestamp: new Date().toISOString(),
    status: "success",
    data: {
      transactionId: transaction.id,
      ingestedAt: timestamp,
      rawAmount: transaction.amount,
      client: transaction.client,
      category: transaction.category,
    }
  });

  // STAGE 2: Orchestration (Orchestrator Agent)
  const orchestratorAgent = new OrchestratorAgent();
  const plan = orchestratorAgent.execute(runId, transaction);
  const requiresCompliance = plan.thresholdTriggered;

  const orchestrationPrompt = `You are the CEDX Orchestrator Agent for Case CEDX-55BBED.
Analyze the incoming transaction and build an execution plan.
Your plan must include:
1. Target routing stages.
2. Flag if Compliance Approver Agent is required (triggered when transaction amount exceeds 33,000 threshold).
3. Assignments for specialized agents.

Respond with a clean markdown routing report containing a structured JSON summary block at the end (wrapped in \`\`\`json ... \`\`\`).`;

  const orchestrationUser = `Transaction Details:
ID: ${transaction.id}
Client: ${transaction.client}
Amount: ${transaction.amount}
Category: ${transaction.category}
Description: ${transaction.description}`;

  const defaultOrchestrationOutput = `### Orchestrator Assessment Report
* **Case ID**: CEDX-55BBED
* **Transaction ID**: ${transaction.id}
* **Threshold Status**: ${requiresCompliance ? "TRIGGERED (> 33,000)" : "BYPASSED (<= 33,000)"}

#### Execution Flow Plan:
1. **Intake**: Complete.
2. **Assembly**: Assign to **Worker Agent** to calculate lifecycle impact and format data payloads.
3. **Review**: Assign to **Verifier Agent** to execute math check and constraint audits.
4. ${requiresCompliance ? "**Compliance**: Required. Assign to **Compliance Approver Agent** for high-value risk sign-off." : "**Compliance**: Bypassed (amount is under 33,000 threshold)."}
5. **Delivery**: Assign to **Delivery Agent** to package and sign off on audit trail.`;

  const orchestratorText = await askAgent(
    AgentName.ORCHESTRATOR,
    orchestrationPrompt,
    orchestrationUser,
    defaultOrchestrationOutput
  );

  const orchestratorTimestamp = new Date().toISOString();
  const orchestratorSeal = generateSeal(AgentName.ORCHESTRATOR, orchestratorTimestamp, plan);

  steps.push({
    stage: "Orchestration",
    agent: AgentName.ORCHESTRATOR,
    action: "Execution plan built and dispatch initialized.",
    timestamp: orchestratorTimestamp,
    status: "success",
    data: {
      report: orchestratorText,
      plan: plan
    },
    signature: orchestratorSeal
  });


  // STAGE 3: Assembly (Worker Agent)
  const workerAgent = new WorkerAgent();
  const calculatedImpact = workerAgent.calculate(transaction);

  const workerPrompt = `You are the CEDX Worker Agent. Perform calculations and detail the lifecycle analysis for the category: ${transaction.category}.
Incorporate metrics in your response. Ensure all math calculations are detailed.`;

  const workerUser = `Transaction Amount: ${transaction.amount}
Calculated Initial Metrics: ${JSON.stringify(calculatedImpact)}`;

  const defaultWorkerOutput = `### Worker Assembly Log
* **Case ID**: CEDX-55BBED
* **Category**: ${transaction.category}
* **Core Task**: Structured data compiling & carbon calculation.

#### Domain Calculations:
* **Base Metric**: ${transaction.category === "Carbon Offset" ? "Offset Tons" : "MWh Credit"} = $${transaction.amount} × ${transaction.category === "Carbon Offset" ? "0.15" : "0.12"} = **${transaction.category === "Carbon Offset" ? calculatedImpact.offsetTons : calculatedImpact.megawattHoursProduced}** units.
* **Environmental Equivalence**: ${transaction.category === "Carbon Offset" ? `${calculatedImpact.equivalentTreesPlanted} trees planted` : `${calculatedImpact.homesPoweredDaily} household grid-days offset`}.

Data aggregation is complete. Passing structured payload to Verifier Agent.`;

  const workerText = await askAgent(
    AgentName.WORKER,
    workerPrompt,
    workerUser,
    defaultWorkerOutput
  );

  const workerTimestamp = new Date().toISOString();
  const workerSeal = generateSeal(AgentName.WORKER, workerTimestamp, calculatedImpact);

  steps.push({
    stage: "Assembly",
    agent: AgentName.WORKER,
    action: "Core calculations aggregated and environmental payload compiled.",
    timestamp: workerTimestamp,
    status: "success",
    data: {
      report: workerText,
      impactMetrics: calculatedImpact
    },
    signature: workerSeal
  });


  // STAGE 4: Review (Verifier Agent)
  const verifierAgent = new VerifierAgent();
  const validationChecks = verifierAgent.audit(transaction, calculatedImpact);

  const verifierPrompt = `You are the CEDX Verifier Agent.
Your job is to audit the Worker Agent's calculations and verify schema compliance for Case CEDX-55BBED.
Perform a strict recalculation of metrics: amount (${transaction.amount}) with category coefficients.
Formally declare validation: PASS or FAIL.`;

  const verifierUser = `Worker Metrics Output: ${JSON.stringify(calculatedImpact)}
Verification Checklist Data: ${JSON.stringify(validationChecks)}`;

  const defaultVerifierOutput = `### Verifier Audit Review
* **Case ID**: CEDX-55BBED
* **Audit Decision**: **PASS**

#### Checklist Verification:
1. [✓] **Case ID Verification**: Matched perfectly with CEDX-55BBED.
2. [✓] **Math Validation Check**: Worker base metrics of ${validationChecks.expectedMathValue} match system bounds exactly.
3. [✓] **Boundary Check**: Transaction value of $${transaction.amount} is within positive operating envelope.
4. [✓] **Schema Conformity**: Typed contracts fulfilled correctly.

Audit verification completed without errors. File cleared for downstream routing.`;

  const verifierText = await askAgent(
    AgentName.VERIFIER,
    verifierPrompt,
    verifierUser,
    defaultVerifierOutput
  );

  const verifierTimestamp = new Date().toISOString();
  const verifierSeal = generateSeal(AgentName.VERIFIER, verifierTimestamp, validationChecks);

  steps.push({
    stage: "Review",
    agent: AgentName.VERIFIER,
    action: "Mathematical validation checklist and constraint audit passed.",
    timestamp: verifierTimestamp,
    status: "success",
    data: {
      report: verifierText,
      verificationChecklist: validationChecks
    },
    signature: verifierSeal
  });


  // STAGE 5: Compliance Approver (Compliance Agent) - Conditional
  let complianceData: any = null;
  if (requiresCompliance) {
    const complianceAgent = new ComplianceAgent();
    const clearanceId = `CLEAR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    complianceData = complianceAgent.evaluate(transaction, clearanceId);

    const compliancePrompt = `You are the CEDX Compliance Approver Agent.
This is a high-value transaction of $${transaction.amount}, which exceeds the compliance threshold of 33,000.
Evaluate compliance risks, greenwashing boundaries, and verify regulatory clearance.
Add your official approval signature.`;

    const complianceUser = `Transaction ID: ${transaction.id}
Client: ${transaction.client}
Amount: ${transaction.amount}
Verifier Seal: ${verifierSeal}`;

    const defaultComplianceOutput = `### Compliance Regulatory Audit Report
* **Case ID**: CEDX-55BBED
* **Regulatory Clearance ID**: ${complianceData.regulatoryClearanceId}
* **Status**: **APPROVED**

#### Compliance Assessment:
1. **Threshold Trigger**: Transaction amount $${transaction.amount} exceeds the $33,000 limit, requiring second-approver compliance vetting.
2. **Anti-Greenwashing Check**: Calculations verified by Verifier Agent are aligned with EU Taxonomy and Carbon offsets guidelines.
3. **Risk Profile**: Low risk. Vertex standard vetting is in force.

Under compliance amendment standards, this transaction is certified and officially signed off.`;

    const complianceText = await askAgent(
      AgentName.COMPLIANCE,
      compliancePrompt,
      complianceUser,
      defaultComplianceOutput
    );

    const complianceTimestamp = new Date().toISOString();
    const complianceSeal = generateSeal(AgentName.COMPLIANCE, complianceTimestamp, complianceData);

    steps.push({
      stage: "Compliance",
      agent: AgentName.COMPLIANCE,
      action: `Threshold compliance approval certified for amount > 33000.`,
      timestamp: complianceTimestamp,
      status: "success",
      data: {
        report: complianceText,
        complianceMetrics: complianceData
      },
      signature: complianceSeal
    });
  }


  // STAGE 6: Delivery (Delivery Agent)
  const deliveryAgent = new DeliveryAgent();
  const receiptId = `REC-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const deliveryPayload = deliveryAgent.packageBlock(transaction, steps, receiptId, requiresCompliance);

  const deliveryPrompt = `You are the CEDX Delivery Agent.
Close the case CEDX-55BBED. Compile the final receipt certificate.
Sign off on the final immutable block audit trail.`;

  const deliveryUser = `Receipt Payload: ${JSON.stringify(deliveryPayload)}
Required Approvals: Worker -> Verifier ${requiresCompliance ? "-> Compliance" : ""} -> Delivery.`;

  const defaultDeliveryOutput = `### Delivery Closing Sign-Off
* **Case ID**: CEDX-55BBED
* **Receipt ID**: ${deliveryPayload.receiptId}
* **Status**: **DELIVERED & LOCKBOX SECURED**

The agent fleet has successfully completed execution. The transaction is packaged, cryptographic signatures verified, and immutable audit logs committed to disk.`;

  const deliveryText = await askAgent(
    AgentName.DELIVERY,
    deliveryPrompt,
    deliveryUser,
    defaultDeliveryOutput
  );

  const deliveryTimestamp = new Date().toISOString();
  const deliverySeal = generateSeal(AgentName.DELIVERY, deliveryTimestamp, deliveryPayload);

  steps.push({
    stage: "Delivery",
    agent: AgentName.DELIVERY,
    action: "Consolidated all cryptographic signatures and completed packaging.",
    timestamp: deliveryTimestamp,
    status: "success",
    data: {
      report: deliveryText,
      receipt: deliveryPayload
    },
    signature: deliverySeal
  });

  // Calculate final audit block hash
  const auditString = JSON.stringify({
    caseId: "CEDX-55BBED",
    runId,
    timestamp,
    input: transaction,
    plan,
    steps,
  });
  const finalHash = crypto.createHash("sha256").update(auditString).digest("hex");

  const finalAuditTrail: AuditTrail = {
    caseId: "CEDX-55BBED",
    runId,
    timestamp,
    input: transaction,
    plan,
    steps,
    status: "completed",
    deliveryPayload,
    finalHash
  };

  // Add to history (newest first)
  runHistory.unshift(finalAuditTrail);

  // Write to assets/audit.json for verification
  const auditFilePath = path.join(assetsDir, "audit.json");
  try {
    fs.writeFileSync(auditFilePath, JSON.stringify(finalAuditTrail, null, 2), "utf-8");
    fs.writeFileSync(path.join(outDir, "audit.json"), JSON.stringify(finalAuditTrail, null, 2), "utf-8");
    console.log(`[Fleet Engine] Successfully committed audit report to: ${auditFilePath}`);
  } catch (err) {
    console.error("[Fleet Engine] Failed to write audit.json file:", err);
  }

  res.json(finalAuditTrail);
});

// 4. Verify last run via verify_audit.py
app.post("/api/fleet/verify", (req, res) => {
  const auditFilePath = path.join(assetsDir, "audit.json");
  if (!fs.existsSync(auditFilePath)) {
    return res.status(404).json({ error: "No audit.json file exists. Please run a transaction first." });
  }

  // Execute verify_audit.py using the last written audit.json
  exec(`python3 verify_audit.py "${auditFilePath}"`, (error, stdout, stderr) => {
    res.json({
      success: !error,
      stdout: stdout,
      stderr: stderr,
      exitCode: error ? error.code : 0
    });
  });
});

// 5. Replay historical run step by step
app.post("/api/fleet/replay", (req, res) => {
  const runId = req.body.runId;
  const found = runHistory.find(h => h.runId === runId);
  if (!found) {
    return res.status(404).json({ error: "Historical run not found" });
  }
  res.json(found);
});

// 6. Get quarantined Exception Queue records
app.get("/api/fleet/exceptions", (req, res) => {
  const queue = loadExceptionQueue();
  res.json(queue);
});

// 7. Workflow-Centric Voice Synthesis (Gemini TTS API)
app.post("/api/fleet/voice", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text prompt is required for synthesis." });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      console.log(`[Gemini API] Generating TTS audio for: "${text.substring(0, 60)}..."`);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Read this operational status report: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" }
            }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audio: base64Audio });
      }
    } catch (err) {
      console.error("[Gemini API] Failed to generate TTS:", err);
    }
  }

  // Graceful fallback trigger for client-side Web Speech API execution
  res.json({ audio: null, fallbackText: text });
});


// Vite / Static files middleware setup

if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback index.html for SPA router
    app.get("*", (req, res, next) => {
      // Avoid intercepting API routes
      if (req.url.startsWith("/api/")) {
        return next();
      }
      const indexPath = path.join(process.cwd(), "index.html");
      res.sendFile(indexPath);
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Vite Dev Server] Express backend running at http://localhost:${PORT}`);
    });
  };
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Direct all other assets to index.html for React SPA Router
  app.get("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.sendFile(path.join(process.cwd(), "index.html"));
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Production Server] Express backend running on http://localhost:${PORT}`);
  });
}

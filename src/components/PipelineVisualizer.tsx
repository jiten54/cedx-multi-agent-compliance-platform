/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditStep, AgentName } from "../types";
import { 
  ClipboardCheck, 
  Cpu, 
  Wrench, 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  ArrowRight,
  Lock,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

interface PipelineVisualizerProps {
  steps: AuditStep[];
  thresholdTriggered: boolean;
  onSelectAgentReport: (report: { title: string; content: string; data: any; signature?: string }) => void;
}

export default function PipelineVisualizer({ steps, thresholdTriggered, onSelectAgentReport }: PipelineVisualizerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Define static stage structures with elegant dark slate colors
  const stages = [
    {
      id: "Intake",
      label: "Intake",
      role: "System",
      icon: ClipboardCheck,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
    },
    {
      id: "Orchestration",
      label: "Orchestration",
      role: AgentName.ORCHESTRATOR,
      icon: Cpu,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
    },
    {
      id: "Assembly",
      label: "Assembly",
      role: AgentName.WORKER,
      icon: Wrench,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
    },
    {
      id: "Review",
      label: "Review",
      role: AgentName.VERIFIER,
      icon: CheckCircle,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
    },
    {
      id: "Compliance",
      label: "Compliance",
      role: AgentName.COMPLIANCE,
      icon: ShieldCheck,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
      conditional: true,
    },
    {
      id: "Delivery",
      label: "Delivery",
      role: AgentName.DELIVERY,
      icon: Truck,
      color: "border-slate-800 text-slate-500 bg-slate-950/40",
      activeColor: "border-indigo-500 bg-slate-800 text-indigo-300 ring-2 ring-indigo-500/20",
      successColor: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500",
    },
  ];

  const handleBlockClick = (stageId: string, stepData: AuditStep | undefined) => {
    if (!stepData) return;
    
    // Package into report modal structure
    onSelectAgentReport({
      title: `${stageId} Stage Report (${stepData.agent})`,
      content: stepData.data.report || `#### Operational Action\n${stepData.action}`,
      data: stepData.data,
      signature: stepData.signature,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
            Active Workflow Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click on any completed agent node below to inspect signed audit logs and detailed calculation metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Routing Link:</span>
          <span className="text-xs bg-slate-950 border border-slate-800 text-indigo-400 px-2.5 py-1 rounded font-mono font-bold">
            Worker → Verifier {thresholdTriggered ? "→ Compliance" : ""} → Delivery
          </span>
        </div>
      </div>

      {/* Pipeline Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
        {stages.map((stage, idx) => {
          // Find matching execution log step for this stage
          const stepData = steps.find((s) => s.stage === stage.id);
          const isCompleted = !!stepData;
          const isBypassed = stage.conditional && !thresholdTriggered;
          
          // Determine status of block
          let blockStyle = stage.color;
          let badgeText = "Pending";
          let badgeStyle = "bg-slate-950/60 text-slate-500 border-slate-800";

          if (isBypassed) {
            blockStyle = "border-slate-950 opacity-20 bg-slate-950/10 text-slate-600";
            badgeText = "Bypassed";
            badgeStyle = "bg-slate-950/10 text-slate-600 border-transparent";
          } else if (isCompleted) {
            blockStyle = stage.successColor + " border shadow-md cursor-pointer hover:scale-[1.01] hover:bg-emerald-500/10";
            badgeText = "Verified";
            badgeStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 font-bold";
          } else if (!isCompleted && steps.length === idx) {
            // It is the current active step
            blockStyle = stage.activeColor + " border animate-pulse";
            badgeText = "Processing";
            badgeStyle = "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold";
          }

          const StageIcon = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center">
              {/* Connector line for large screens */}
              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-slate-800 z-0">
                  <div className={`h-full bg-emerald-500 transition-all duration-500 ${steps.length > idx ? "w-full" : "w-0"}`} />
                </div>
              )}

              <div
                onClick={() => isCompleted && handleBlockClick(stage.id, stepData)}
                className={`w-full p-4 rounded-xl border flex flex-col items-center text-center transition-all z-10 select-none ${blockStyle}`}
              >
                <div className="p-2.5 rounded-lg bg-slate-950 shadow-inner border border-slate-800 mb-2.5 text-inherit">
                  <StageIcon className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="text-xs font-bold font-display uppercase tracking-wider text-white">{stage.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{stage.role}</div>

                <div className={`mt-3 text-[10px] px-2 py-0.5 border rounded-full font-medium ${badgeStyle}`}>
                  {badgeText}
                </div>

                {isCompleted && stepData.signature && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-1 text-[8px] font-mono text-slate-400">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    {stepData.signature.substring(0, 8)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accordion list of actions */}
      <div className="mt-8 border-t border-slate-800 pt-6">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Fleet Execution Log Trail
        </h3>
        
        <div className="space-y-2.5">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded mr-2 uppercase">
                      {step.stage}
                    </span>
                    <span className="text-xs font-bold text-white">{step.agent}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="text-[10px] font-mono">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedIndex === idx ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expandedIndex === idx && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800 text-xs text-slate-300 bg-slate-950">
                  <div className="font-semibold text-slate-400 mb-2 text-[10px] uppercase tracking-wider">Action Description:</div>
                  <p className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-mono text-slate-300 mb-3 select-text">
                    {step.action}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold text-slate-400 mb-1.5 text-[10px] uppercase tracking-wider">Payload Structured Keys:</div>
                      <pre className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-[140px] text-emerald-400 select-text">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </div>

                    {step.signature && (
                      <div>
                        <div className="font-semibold text-slate-400 mb-1.5 text-[10px] uppercase tracking-wider">Agent Cryptographic Seal:</div>
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 text-[10px] font-mono break-all text-emerald-400 flex items-start gap-2 select-text">
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">SHA-256 Digest:</div>
                            <div className="font-bold">{step.signature}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


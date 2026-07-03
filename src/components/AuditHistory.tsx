/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditTrail } from "../types";
import { 
  FileText, 
  RotateCcw, 
  Terminal, 
  Eye, 
  Download,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

interface AuditHistoryProps {
  history: AuditTrail[];
  onReplay: (runId: string) => void;
  onViewJson: (trail: AuditTrail) => void;
  verifyTerminalOutput: string | null;
  isVerifying: boolean;
  onRunVerifyScript: () => void;
}

export default function AuditHistory({
  history,
  onReplay,
  onViewJson,
  verifyTerminalOutput,
  isVerifying,
  onRunVerifyScript
}: AuditHistoryProps) {
  const [showTerminal, setShowTerminal] = useState(false);

  // Trigger download of standard audit.json
  const handleDownloadJson = (trail: AuditTrail) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trail, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cedx_audit_${trail.runId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-6">
      {/* Verification Terminal Trigger */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Python Compliance Auditor
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify compliance rules and integrity checksums using <strong>verify_audit.py</strong> against the <strong>audit.schema.json</strong> schema.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowTerminal(true);
            onRunVerifyScript();
          }}
          disabled={isVerifying || history.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Terminal className="w-4 h-4" />
          {isVerifying ? "Auditing..." : "Execute verify_audit.py"}
        </button>
      </div>

      {/* Audit Terminal Panel */}
      {showTerminal && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900 text-slate-500 mb-3 text-[10px] tracking-wide uppercase">
            <span className="flex items-center gap-1.5 font-bold text-slate-400">
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Subprocess Output - Audit Compliance Sandbox
            </span>
            <button 
              onClick={() => setShowTerminal(false)}
              className="hover:text-white transition-colors cursor-pointer text-[10px]"
            >
              [Close Terminal]
            </button>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto font-mono text-slate-300 leading-relaxed pr-1 select-text">
            <div className="text-indigo-400">$ python3 verify_audit.py assets/audit.json</div>
            {isVerifying ? (
              <div className="text-slate-400 italic animate-pulse">[*] Launching subprocess checker against JSON schema definitions...</div>
            ) : verifyTerminalOutput ? (
              <pre className="whitespace-pre-wrap font-mono text-emerald-400 font-medium select-text">
                {verifyTerminalOutput}
              </pre>
            ) : (
              <div className="text-rose-400">[!] No verification results found. Run a simulation run first to write assets/audit.json.</div>
            )}
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-indigo-400" />
          Audit Trail Database History
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
            <h3 className="text-xs font-bold text-slate-400">No audits found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select or configure a transaction above and trigger the fleet simulation.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {history.map((trail) => {
              const exceedsThreshold = trail.input.amount > 33000;

              return (
                <div
                  key={trail.runId}
                  className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {trail.runId}
                      </span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {new Date(trail.timestamp).toLocaleDateString()} {new Date(trail.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">
                      {trail.input.client}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="bg-slate-800 text-slate-300 border border-slate-750 px-1.5 py-0.5 rounded font-medium">
                        {trail.input.category}
                      </span>
                      <span className="font-mono text-slate-500">
                        Hash: {trail.finalHash.substring(0, 10)}...
                      </span>
                      {exceedsThreshold ? (
                        <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-semibold border border-rose-500/20">
                          Compliance Approved
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20">
                          Standard Approval
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Value Processed</div>
                      <div className="text-sm font-mono font-bold text-white">
                        ${trail.input.amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onReplay(trail.runId)}
                        title="Replay transaction steps"
                        className="p-2 text-indigo-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onViewJson(trail)}
                        title="Inspect full JSON"
                        className="p-2 text-slate-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownloadJson(trail)}
                        title="Download audit file"
                        className="p-2 text-slate-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


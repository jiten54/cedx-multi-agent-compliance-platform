/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Lock, ClipboardCheck, Terminal } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  markdownContent?: string;
  jsonData?: any;
  signature?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  title,
  markdownContent,
  jsonData,
  signature,
}: ReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Audit Inspector
            </h3>
            <h2 className="text-sm font-bold text-white font-display mt-0.5">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-text">
          {/* Signature/Seal block */}
          {signature && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] font-mono">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <ClipboardCheck className="w-4 h-4" />
                  Verified Cryptographic Integrity Seal
                </div>
                <div className="text-emerald-300 mt-1 font-semibold selection:bg-emerald-900/50">
                  SHA-256 Digest: {signature}
                </div>
              </div>
            </div>
          )}

          {/* Markdown Content or raw text */}
          {markdownContent && (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans space-y-3">
              {markdownContent.split("\n").map((line, idx) => {
                if (line.startsWith("###")) {
                  return <h3 key={idx} className="text-xs font-bold text-white font-display pt-3 pb-1 border-b border-slate-800 uppercase tracking-wider">{line.replace("###", "")}</h3>;
                }
                if (line.startsWith("##")) {
                  return <h2 key={idx} className="text-sm font-bold text-white font-display pt-4 pb-2 border-b border-slate-800 uppercase tracking-wider">{line.replace("##", "")}</h2>;
                }
                if (line.startsWith("*")) {
                  return (
                    <li key={idx} className="ml-4 list-disc pl-1 font-sans text-slate-300">
                      {line.replace("*", "").trim()}
                    </li>
                  );
                }
                if (line.trim() === "") return <div key={idx} className="h-2" />;
                return <p key={idx} className="font-sans text-slate-300 leading-relaxed">{line}</p>;
              })}
            </div>
          )}

          {/* JSON Data display */}
          {jsonData && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Structured Payload JSON</span>
              </div>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-[340px] leading-relaxed selection:bg-indigo-900 shadow-inner">
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Acknowledge Vetting
          </button>
        </div>
      </div>
    </div>
  );
}


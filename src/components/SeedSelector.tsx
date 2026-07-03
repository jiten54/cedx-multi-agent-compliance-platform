/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Database, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import { CEDXTransaction } from "../types";

interface SeedSelectorProps {
  seeds: CEDXTransaction[];
  selectedId: string;
  onSelect: (tx: CEDXTransaction) => void;
}

export default function SeedSelector({ seeds, selectedId, onSelect }: SeedSelectorProps) {
  const threshold = 33000;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <h2 className="text-sm font-bold text-white font-display flex items-center gap-2 mb-3.5 uppercase tracking-wider">
        <Database className="w-4 h-4 text-indigo-400" />
        Intake Templates
      </h2>
      <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
        Select a transaction pattern from our vetted pool to feed into the multi-agent orchestration.
      </p>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {seeds.map((tx) => {
          const isSelected = tx.id === selectedId;
          const exceedsThreshold = tx.amount > threshold;

          return (
            <button
              key={tx.id}
              onClick={() => onSelect(tx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                isSelected
                  ? "border-indigo-500 bg-slate-800/80 ring-1 ring-indigo-500/30"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300"
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                      {tx.id}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-medium">
                      {tx.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1 line-clamp-1">
                    {tx.client}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-indigo-400">
                    ${tx.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between w-full border-t border-slate-800 pt-2 text-[10px]">
                {exceedsThreshold ? (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                    Vetted Path
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Standard Path
                  </span>
                )}
                
                <span className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 font-medium uppercase tracking-wider text-[9px]">
                  Load
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


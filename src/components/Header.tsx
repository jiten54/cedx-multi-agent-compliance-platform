/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cpu, Activity, ShieldAlert, Layers } from "lucide-react";

interface HeaderProps {
  historyCount: number;
  totalValue: number;
}

export default function Header({ historyCount, totalValue }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white font-display text-sm tracking-wider">
          CX
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white uppercase font-display flex items-center gap-2">
            CEDX Agent Fleet Management
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">SYSTEM_VERSION: 2.1.0-STABLE</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Dynamic counters as premium widgets */}
        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Runs:</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {historyCount}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Vetted Value:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ${totalValue.toLocaleString()}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Rule Threshold:</span>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              $33,000
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Case Identifier</p>
            <p className="text-xs font-mono text-indigo-400">CEDX-55BBED</p>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider font-display">Fleet Healthy</span>
          </div>
        </div>
      </div>
    </header>
  );
}


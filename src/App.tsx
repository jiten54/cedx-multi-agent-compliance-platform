/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { CEDXTransaction, AuditTrail, AuditStep } from "./types";
import Header from "./components/Header";
import SeedSelector from "./components/SeedSelector";
import TransactionForm from "./components/TransactionForm";
import PipelineVisualizer from "./components/PipelineVisualizer";
import AuditHistory from "./components/AuditHistory";
import ReportModal from "./components/ReportModal";
import { 
  ShieldAlert, 
  BookOpen, 
  Lock, 
  Cpu, 
  Activity, 
  Layers, 
  Terminal, 
  Settings, 
  CheckCircle,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Truck
} from "lucide-react";

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/$/, "");

export default function App() {
  const [seeds, setSeeds] = useState<CEDXTransaction[]>([]);
  const [history, setHistory] = useState<AuditTrail[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  
  // Navigation View Controls
  const [activeTab, setActiveTab] = useState<"dashboard" | "exceptions" | "compliance" | "delivery">("dashboard");
  
  // Active/selected state
  const [selectedTx, setSelectedTx] = useState<CEDXTransaction | null>(null);
  const [activeTrail, setActiveTrail] = useState<AuditTrail | null>(null);
  
  // Loading & terminal validation states
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);

  // Text-To-Speech Synthesis States
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Modal inspection states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMarkdown, setModalMarkdown] = useState<string | undefined>(undefined);
  const [modalJson, setModalJson] = useState<any | undefined>(undefined);
  const [modalSignature, setModalSignature] = useState<string | undefined>(undefined);

  // Load initial dataset
  useEffect(() => {
    fetchSeeds();
    fetchHistory();
    fetchExceptions();
  }, []);

  // Set default active view once seeds load
  const fetchSeeds = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/seeds`);
      const data = await res.json();
      if (data && data.transactions) {
        setSeeds(data.transactions);
        // Default to first seed
        setSelectedTx(data.transactions[0]);
      }
    } catch (err) {
      console.error("Failed to load seeds:", err);
    }
  };

  const fetchExceptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/exceptions`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setExceptions(data);
      }
    } catch (err) {
      console.error("Failed to load exceptions:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/history`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
        if (data.length > 0) {
          setActiveTrail(data[0]); // Populate active pipeline with latest run
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // Run full simulation
  const handleRunFleet = async (tx: CEDXTransaction) => {
    setIsRunning(true);
    setTerminalOutput(null); // Reset terminal outputs for fresh run
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: tx }),
      });
      const newTrail: AuditTrail = await res.json();
      
      // Update history state
      setHistory((prev) => [newTrail, ...prev]);
      setActiveTrail(newTrail);
      
      // Refresh exception queue as well in case it quarantined
      await fetchExceptions();

      if (newTrail.status === "failed") {
        setActiveTab("exceptions");
      }
      
      // Highlight new execution success
      console.log(`[Fleet Workspace] Run completed: ${newTrail.runId}`);
    } catch (err) {
      console.error("Agent fleet failed to execute:", err);
    } finally {
      setIsRunning(false);
    }
  };

  // Replay a historical run step-by-step
  const handleReplay = (runId: string) => {
    const found = history.find((h) => h.runId === runId);
    if (found) {
      setActiveTrail(found);
      setSelectedTx(found.input);
      setTerminalOutput(null); // Clear old verify outputs on switch
    }
  };

  // Trigger verify_audit.py script
  const handleRunVerifyScript = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/verify`, { method: "POST" });
      const data = await res.json();
      
      const formattedOutput = data.success
        ? `${data.stdout}\n[SUCCESS] exit code: 0`
        : `[ERROR] Verification Script Failed:\n${data.stderr || data.stdout}\nexit code: ${data.exitCode}`;
        
      setTerminalOutput(formattedOutput);
    } catch (err) {
      setTerminalOutput(`[CRITICAL] Failed to execute verification subprocess: ${err}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Workflow-Centric Voice Synthesis trigger
  const handleSpeakSummary = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!activeTrail) return;

    // Create a concise readable summary text of the active audit trail
    let summaryText = "";
    if (activeTrail.status === "failed") {
      summaryText = `Alert! Case CEDX-55BBED run failed. The transaction from client ${activeTrail.input.client} with amount ${activeTrail.input.amount} has been quarantined. The error reason is: ${activeTrail.steps[0]?.action || "missing metadata"}.`;
    } else {
      const requiresComp = activeTrail.plan?.thresholdTriggered;
      summaryText = `Case CEDX-55BBED run completed successfully. Standard environmental calculations assembled by Worker Agent for client ${activeTrail.input.client} for an amount of ${activeTrail.input.amount} dollars. Recalculation audited and passed by Verifier Agent. ${requiresComp ? "Compliance second-approver vetting has been successfully authorized for high-value guidelines." : "Compliance vetting bypassed as value is within threshold limits."} Final secure audit block signed and delivered with hash ending in ${activeTrail.finalHash.substring(0, 6)}.`;
    }

    setIsSpeaking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText })
      });
      const data = await res.json();

      if (data.audio) {
        const audioBytes = atob(data.audio);
        const arrayBuffer = new ArrayBuffer(audioBytes.length);
        const uintArray = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioBytes.length; i++) {
          uintArray[i] = audioBytes.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        // Local browser TTS fallback
        const utterance = new SpeechSynthesisUtterance(summaryText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("TTS playback failure:", err);
      setIsSpeaking(false);
    }
  };

  // Trigger modal report inspections
  const handleSelectAgentReport = (report: { title: string; content: string; data: any; signature?: string }) => {
    setModalTitle(report.title);
    setModalMarkdown(report.content);
    setModalJson(report.data);
    setModalSignature(report.signature);
    setIsModalOpen(true);
  };

  const handleViewFullJson = (trail: AuditTrail) => {
    setModalTitle(`Immutable Audit Record: ${trail.runId}`);
    setModalMarkdown(undefined);
    setModalJson(trail);
    setModalSignature(trail.finalHash);
    setIsModalOpen(true);
  };

  // Calculate cumulative stats
  const totalValue = history.reduce((sum, item) => sum + (item.status === "completed" ? item.input.amount : 0), 0);
  const totalApprovals = history.filter(item => item.status === "completed" && item.input.amount > 33000).length;

  // Active status conditions for side-monitors
  const isSelectedHighValue = selectedTx ? selectedTx.amount > 33000 : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Banner and Summary Stats */}
      <Header historyCount={history.length} totalValue={totalValue} />

      {/* Main Workspace Frame with sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
        {/* Sidebar Navigation & Live Widgets */}
        <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <nav className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Operational Cockpit</div>
              
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/30 font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Dashboard Console
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              <button 
                onClick={() => setActiveTab("exceptions")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all ${
                  activeTab === "exceptions"
                    ? "bg-amber-600/15 text-amber-400 border-amber-500/30 font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Exception Queue
                </span>
                {exceptions.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-500/20 text-amber-300 rounded font-bold border border-amber-500/30">
                    {exceptions.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab("compliance")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all ${
                  activeTab === "compliance"
                    ? "bg-rose-600/15 text-rose-400 border-rose-500/30 font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Compliance Panel
                </span>
                {totalApprovals > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-rose-500/20 text-rose-300 rounded font-bold border border-rose-500/30">
                    {totalApprovals}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab("delivery")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all ${
                  activeTab === "delivery"
                    ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/30 font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery Center
                </span>
              </button>
            </nav>

            {/* Voice layer briefing action */}
            {activeTrail && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                  Voice Briefing
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Hear an AI-synthesized audit summary and execution path explanations.
                </p>
                <button
                  onClick={handleSpeakSummary}
                  className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    isSpeaking 
                      ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      Mute Briefing
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen Summary
                    </>
                  )}
                </button>
                {isSpeaking && (
                  <div className="flex justify-center gap-1 py-1">
                    <span className="w-1 h-3 bg-indigo-500 rounded animate-pulse" />
                    <span className="w-1 h-4 bg-indigo-400 rounded animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-indigo-500 rounded animate-pulse delay-150" />
                    <span className="w-1 h-5 bg-indigo-300 rounded animate-pulse delay-100" />
                    <span className="w-1 h-3 bg-indigo-400 rounded animate-pulse delay-200" />
                  </div>
                )}
              </div>
            )}

            {/* Amendment Status Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Amendment Status
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-500">Approver</span>
                  <span className="font-mono text-slate-300 font-bold">compliance</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-500">Threshold</span>
                  <span className="font-mono text-indigo-400 font-bold">$33,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Limit</span>
                  <span className="font-mono text-slate-400">Strict Enforce</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div>CASE_ID: CEDX-55BBED</div>
            <div>STATUS: FULLY_OPERATIONAL</div>
          </div>
        </aside>

        {/* Cockpit Views Work Area */}
        <main className="flex-1 p-6 space-y-6 overflow-hidden">
          
          {/* VIEW 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Real-time Role Status Monitors */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Orchestrator node */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Orchestrator Node</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                      {isRunning ? "Orchestrating" : "Standby Ready"}
                    </div>
                  </div>
                </div>

                {/* Worker node */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Worker Node</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                      {isRunning ? "Assembling Payload" : "State Synced"}
                    </div>
                  </div>
                </div>

                {/* Verifier node */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Verifier Node</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerifying ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                      {isVerifying ? "Verifying Schema" : "Signature Ready"}
                    </div>
                  </div>
                </div>

                {/* Compliance node */}
                <div className={`border rounded-xl p-3.5 flex items-center gap-3 transition-colors ${
                  isSelectedHighValue 
                    ? "bg-rose-500/5 border-rose-500/25 text-rose-300" 
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}>
                  <div className={`p-2 rounded-lg shrink-0 border ${
                    isSelectedHighValue 
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                      : "bg-slate-950/60 text-slate-500 border-slate-850"
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Compliance Intercept</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                      {isSelectedHighValue ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px]">Vetting Required</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Passive Monitoring
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Upper Configuration Dashboard Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template selector pool */}
                <div className="lg:col-span-1">
                  <SeedSelector
                    seeds={seeds}
                    selectedId={selectedTx?.id || ""}
                    onSelect={(tx) => setSelectedTx(tx)}
                  />
                </div>

                {/* Intake configuration panel */}
                <div className="lg:col-span-1">
                  {selectedTx && (
                    <TransactionForm
                      initialTransaction={selectedTx}
                      onRun={handleRunFleet}
                      isRunning={isRunning}
                    />
                  )}
                </div>

                {/* Architectural guidelines card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-white/5">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-xs font-bold font-display uppercase tracking-widest text-white">
                        Compliance Manual
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      The CEDX Multi-Agent system executes strict transaction audits using clearly separated agent nodes communicating via typed contracts.
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="flex gap-2.5 items-start bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                        <span className="w-5 h-5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                          1
                        </span>
                        <div>
                          <span className="font-bold text-white text-[11px]">Standard Flow (≤ $33,000):</span>
                          <p className="text-slate-400 mt-0.5 text-[10px]">Orchestrator routes: Worker → Verifier → Delivery.</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                        <span className="w-5 h-5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-lg flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                          2
                        </span>
                        <div>
                          <span className="font-bold text-rose-300 text-[11px]">Vetted Flow (&gt; $33,000):</span>
                          <p className="text-slate-400 mt-0.5 text-[10px]">Compliance Approver intercepts, verifies rules, and authorizes.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-3.5 mt-6 flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      SHA-256 Ledger Lock
                    </span>
                    <span>Case: CEDX-55BBED</span>
                  </div>
                </div>
              </section>

              {/* Active pipeline rendering block */}
              {activeTrail ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Active Workspace Block: <span className="text-indigo-400">{activeTrail.runId}</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Integrity Seal: <span className="text-emerald-400 font-bold">{activeTrail.finalHash ? activeTrail.finalHash.substring(0, 16) : "Unknown"}</span>
                    </div>
                  </div>
                  
                  <PipelineVisualizer
                    steps={activeTrail.steps}
                    thresholdTriggered={activeTrail.plan?.thresholdTriggered || false}
                    onSelectAgentReport={handleSelectAgentReport}
                  />
                </section>
              ) : (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-lg">
                  <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-slate-400">No active run pipeline loaded</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Trigger a transaction simulation above to launch the live multi-agent workflow.
                  </p>
                </section>
              )}

              {/* Historical ledgers and validator terminal */}
              <section>
                <AuditHistory
                  history={history}
                  onReplay={handleReplay}
                  onViewJson={handleViewFullJson}
                  verifyTerminalOutput={terminalOutput}
                  isVerifying={isVerifying}
                  onRunVerifyScript={handleRunVerifyScript}
                />
              </section>
            </>
          )}

          {/* VIEW 2: EXCEPTION QUEUE */}
          {activeTab === "exceptions" && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Quarantined Exception Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This module monitors and isolates any transaction that violates strict CEDX validation criteria or presents security risk alerts.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                  {exceptions.length} Anomalies Logged
                </span>
              </div>

              {exceptions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Exception Queue Is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    All transaction submissions have satisfied security, outlier constraints, and environmental categories. No threats isolated.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exceptions.map((ex, idx) => (
                    <div 
                      key={ex.id || idx} 
                      className="bg-slate-950/50 border border-slate-850 hover:border-amber-500/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-400">{ex.transactionId}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                            ex.reasonCode === "INJECTION_BLOCKED" 
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                              : ex.reasonCode === "OUTLIER"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}>
                            {ex.reasonCode}
                          </span>
                          <span className="text-slate-600 font-mono text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-slate-500">{new Date(ex.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-bold">
                          {ex.message}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                          <span>Counterparty: <strong className="text-slate-300">{ex.client}</strong></span>
                          <span>Category: <strong className="text-slate-300">{ex.category}</strong></span>
                          <span>Value: <strong className="text-indigo-400">${Number(ex.amount).toLocaleString()}</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <button
                          onClick={() => {
                            setSelectedTx({
                              id: ex.transactionId,
                              client: ex.client,
                              amount: ex.amount,
                              category: ex.category || "Carbon Offset",
                              description: ""
                            });
                            setActiveTab("dashboard");
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                        >
                          Load in Form
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* VIEW 3: COMPLIANCE PANEL */}
          {activeTab === "compliance" && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-500" />
                    Regulatory Compliance Ledger
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Under strict CEDX operational regulations, all transaction values exceeding the <strong>$33,000</strong> ceiling are auto-routed for Compliance Approver vetting.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full">
                  Approver Role: compliance
                </div>
              </div>

              {/* Compliance Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Limit Trigger threshold</div>
                  <div className="text-xl font-bold font-mono text-indigo-400">$33,000</div>
                  <p className="text-[9px] text-slate-500">Strictly enforced ceiling rules</p>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Vetted Vouchers Issued</div>
                  <div className="text-xl font-bold font-mono text-rose-400">{totalApprovals} Approved</div>
                  <p className="text-[9px] text-slate-500">Multi-agent regulatory clearance</p>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Audit Target Agency</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">EU Taxonomy V2</div>
                  <p className="text-[9px] text-slate-500">Immutable math validation standards</p>
                </div>
              </div>

              {/* Vetted ledger list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">Triggered Clearance Logs</h3>
                {history.filter(item => item.status === "completed" && item.input.amount > 33000).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 leading-relaxed border border-slate-800/60 rounded-xl bg-slate-950/20">
                    No high-value compliance files routed yet. Create or load a transaction with value &gt; $33,000 to trigger.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.filter(item => item.status === "completed" && item.input.amount > 33000).map((item, idx) => {
                      // Grab the compliance step
                      const complianceStep = item.steps.find(s => s.stage === "Compliance");
                      const metrics = complianceStep?.data?.complianceMetrics;
                      return (
                        <div key={idx} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-900 pb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-white">{item.runId}</span>
                              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                                {metrics?.regulatoryClearanceId || "CLEAR-APPROVED"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Client Counterparty</span>
                              <strong className="text-slate-200">{item.input.client}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Audited Sum</span>
                              <strong className="text-rose-300">${Number(item.input.amount).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Verification Signature</span>
                              <span className="font-mono text-[10px] text-slate-400 block truncate" title={complianceStep?.signature}>
                                {complianceStep?.signature?.substring(0, 12)}...
                              </span>
                            </div>
                            <div className="text-right">
                              <button
                                onClick={() => handleSelectAgentReport({
                                  title: `Compliance Approval Report: ${metrics?.regulatoryClearanceId}`,
                                  content: complianceStep?.data?.report || "",
                                  data: metrics,
                                  signature: complianceStep?.signature
                                })}
                                className="text-indigo-400 hover:text-white hover:underline text-xs font-bold"
                              >
                                Review Clearance Certificate
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* VIEW 4: DELIVERY CENTER */}
          {activeTab === "delivery" && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-500" />
                    Secure Delivery Center
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This module handles packaging, final SHA-256 cryptographic chaining, and receipt dispatch. It seals the block ledger with mathematical certainty.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Status: Channel Sealed
                </span>
              </div>

              {/* Delivery Receipt Registry */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">Dispatched Immutable Receipts</h3>
                {history.filter(item => item.status === "completed").length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 border border-slate-800/60 rounded-xl bg-slate-950/20">
                    No completed multi-agent deliverables registered yet. Run a transaction in the Dashboard.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.filter(item => item.status === "completed").map((item, idx) => {
                      const deliveryStep = item.steps.find(s => s.stage === "Delivery");
                      const receipt = deliveryStep?.data?.receipt;
                      return (
                        <div key={idx} className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold text-indigo-400">{item.runId}</span>
                              <span className="text-[10px] font-mono bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
                                {receipt?.receiptId || "REC-PENDING"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Recipient Client</span>
                              <strong className="text-white">{item.input.client}</strong>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Closing Secure Digest</span>
                              <code className="text-slate-300 font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/50 block truncate" title={receipt?.digest}>
                                {receipt?.digest}
                              </code>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Integrity Block Hash</span>
                              <code className="text-emerald-400 font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/50 block truncate" title={item.finalHash}>
                                {item.finalHash}
                              </code>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-xs">
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <span>Compliance Cert: <strong className={item.plan.thresholdTriggered ? "text-rose-400" : "text-slate-400"}>
                                {item.plan.thresholdTriggered ? "Enforced & Approved" : "Bypassed"}
                              </strong></span>
                              <span>Stages Closed: <strong className="text-slate-300">{item.plan.stages.join(" → ")}</strong></span>
                            </div>
                            <button
                              onClick={() => handleSelectAgentReport({
                                title: `Delivery Closing Report: ${receipt?.receiptId}`,
                                content: deliveryStep?.data?.report || "",
                                data: receipt,
                                signature: deliveryStep?.signature
                              })}
                              className="text-emerald-400 hover:text-white font-bold hover:underline"
                            >
                              Inspect Lockbox
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Inspect Report Overlay Dialog */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        markdownContent={modalMarkdown}
        jsonData={modalJson}
        signature={modalSignature}
      />
    </div>
  );
}


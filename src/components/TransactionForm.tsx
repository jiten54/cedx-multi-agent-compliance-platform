/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CEDXTransaction } from "../types";
import { FileEdit, Play, ShieldAlert, BadgeInfo } from "lucide-react";

interface TransactionFormProps {
  initialTransaction: CEDXTransaction;
  onRun: (tx: CEDXTransaction) => void;
  isRunning: boolean;
}

export default function TransactionForm({ initialTransaction, onRun, isRunning }: TransactionFormProps) {
  const [tx, setTx] = useState<CEDXTransaction>({ ...initialTransaction });
  const threshold = 33000;

  useEffect(() => {
    setTx({ ...initialTransaction });
  }, [initialTransaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTx((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun(tx);
  };

  const isHighValue = tx.amount > threshold;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <h2 className="text-sm font-bold text-white font-display flex items-center gap-2 mb-4 uppercase tracking-wider">
        <FileEdit className="w-4 h-4 text-indigo-400" />
        Configure Intake Packet
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Client Name
          </label>
          <input
            type="text"
            name="client"
            value={tx.client}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm"
            placeholder="Vertex Global LLC"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={tx.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm [&>option]:bg-slate-900"
            >
              <option value="Carbon Offset">Carbon Offset</option>
              <option value="Energy Credit">Energy Credit</option>
              <option value="Renewable Certificate">Renewable Certificate</option>
              <option value="Waste Management">Waste Management</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Value (USD)
            </label>
            <input
              type="number"
              name="amount"
              min="1"
              value={tx.amount || ""}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-indigo-400 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Packet Description
          </label>
          <textarea
            name="description"
            value={tx.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm leading-relaxed"
            placeholder="Outline the operational bounds..."
          />
        </div>

        {/* Dynamic Compliance Threshold Alert */}
        <div
          className={`p-3.5 rounded-xl border flex gap-3 transition-colors ${
            isHighValue
              ? "bg-rose-500/5 border-rose-500/15 text-rose-300"
              : "bg-indigo-500/5 border-indigo-500/15 text-indigo-300"
          }`}
        >
          {isHighValue ? (
            <>
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-rose-200">Threshold Vetting Triggered</span>
                <p className="text-rose-300/80 mt-0.5">
                  Amount exceeds <strong>$33,000</strong>. The system automatically inserts the <strong>Compliance Approver Agent</strong> into the routing pipeline to certify this transaction.
                </p>
              </div>
            </>
          ) : (
            <>
              <BadgeInfo className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-indigo-200">Standard Flow Eligible</span>
                <p className="text-slate-400 mt-0.5">
                  Value under <strong>$33,000</strong>. Streamlined execution flow in force: Worker → Verifier → Delivery.
                </p>
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isRunning}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isRunning ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Orchestrating Fleet...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
              Dispatch Agent Fleet
            </>
          )}
        </button>
      </form>
    </div>
  );
}


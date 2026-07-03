/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";

export interface ExceptionRecord {
  id: string;
  timestamp: string;
  transactionId: string;
  client: string;
  amount: number;
  category: string;
  reasonCode: "STALE" | "MISSING_INPUT" | "OUTLIER" | "INJECTION_BLOCKED" | "LOW_CONFIDENCE" | "UNVERIFIED_ANOMALY";
  description: string;
}

const outDir = path.join(process.cwd(), "out");

export function loadExceptionQueue(): ExceptionRecord[] {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const queuePath = path.join(outDir, "exception_queue.json");
  if (fs.existsSync(queuePath)) {
    try {
      const content = fs.readFileSync(queuePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("[Exception Queue] Failed to parse exception_queue.json, resetting.", err);
      return [];
    }
  }
  return [];
}

export function saveExceptionQueue(queue: ExceptionRecord[]): void {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const queuePath = path.join(outDir, "exception_queue.json");
  try {
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), "utf-8");
  } catch (err) {
    console.error("[Exception Queue] Failed to write exception_queue.json", err);
  }
}

export function addException(
  transactionId: string,
  client: string,
  amount: number,
  category: string,
  reasonCode: ExceptionRecord["reasonCode"],
  description: string
): ExceptionRecord {
  const queue = loadExceptionQueue();
  const exceptionId = `EX-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const record: ExceptionRecord = {
    id: exceptionId,
    timestamp: new Date().toISOString(),
    transactionId,
    client,
    amount,
    category,
    reasonCode,
    description
  };
  
  queue.unshift(record);
  saveExceptionQueue(queue);
  return record;
}

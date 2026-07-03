/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEDXTransaction, AuditStep } from "../types";
import crypto from "crypto";

export interface DeliveryPayload {
  receiptId: string;
  deliveredAt: string;
  recipient: string;
  amount: number;
  digest: string;
  complianceSigned: boolean;
}

export class DeliveryAgent {
  public packageBlock(
    transaction: CEDXTransaction,
    steps: AuditStep[],
    receiptId: string,
    requiresCompliance: boolean
  ): DeliveryPayload {
    const serializedSteps = JSON.stringify(steps);
    const digest = crypto.createHash("sha256").update(serializedSteps).digest("hex");

    return {
      receiptId,
      deliveredAt: new Date().toISOString(),
      recipient: transaction.client,
      amount: transaction.amount,
      digest,
      complianceSigned: requiresCompliance
    };
  }
}

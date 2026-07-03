/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEDXTransaction } from "../types";

export interface ComplianceData {
  thresholdApproved: boolean;
  approverRole: string;
  overrideApplied: boolean;
  thresholdLimit: number;
  evaluatedAmount: number;
  regulatoryClearanceId: string;
}

export class ComplianceAgent {
  private threshold = 33000;

  public evaluate(transaction: CEDXTransaction, clearanceId: string): ComplianceData {
    return {
      thresholdApproved: transaction.amount > this.threshold,
      approverRole: "compliance",
      overrideApplied: false,
      thresholdLimit: this.threshold,
      evaluatedAmount: transaction.amount,
      regulatoryClearanceId: clearanceId
    };
  }
}

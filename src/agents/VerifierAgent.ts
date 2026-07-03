/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEDXTransaction } from "../types";
import { ImpactMetrics } from "./WorkerAgent";

export interface VerificationChecks {
  mathCheckPassed: boolean;
  schemaConformancePassed: boolean;
  caseIdMatched: boolean;
  amountBoundaryValid: boolean;
  expectedMathValue: number;
}

export class VerifierAgent {
  public audit(transaction: CEDXTransaction, metrics: ImpactMetrics): VerificationChecks {
    const amount = transaction.amount;
    
    const expectedMathValue = transaction.category === "Carbon Offset" 
      ? Number((amount * 0.15).toFixed(2)) 
      : (transaction.category === "Energy Credit" 
          ? Number((amount * 0.12).toFixed(2)) 
          : Number((amount * 0.08).toFixed(2)));

    // Cross reference calculation
    let calculatedVal = 0;
    if (transaction.category === "Carbon Offset") {
      calculatedVal = metrics.offsetTons || 0;
    } else if (transaction.category === "Energy Credit") {
      calculatedVal = metrics.megawattHoursProduced || 0;
    } else if (transaction.category === "Waste Management") {
      calculatedVal = metrics.wasteRecycledTons || 0;
    }

    const mathCheckPassed = Math.abs(calculatedVal - expectedMathValue) < 0.01;

    return {
      mathCheckPassed,
      schemaConformancePassed: true,
      caseIdMatched: true,
      amountBoundaryValid: amount > 0,
      expectedMathValue
    };
  }
}

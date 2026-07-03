/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEDXTransaction } from "../types";

export interface ImpactMetrics {
  offsetTons?: number;
  equivalentTreesPlanted?: number;
  avoidedEmissionsCarMiles?: number;
  megawattHoursProduced?: number;
  homesPoweredDaily?: number;
  co2AvoidedKg?: number;
  wasteRecycledTons?: number;
  landfillAvoidedCubicMeters?: number;
  circularEfficiencyIndex?: string;
  recCertificatesCreated?: number;
  gridPurityRate?: string;
}

export class WorkerAgent {
  public calculate(transaction: CEDXTransaction): ImpactMetrics {
    const amount = transaction.amount;
    
    if (transaction.category === "Carbon Offset") {
      return {
        offsetTons: Number((amount * 0.15).toFixed(2)),
        equivalentTreesPlanted: Math.round(amount * 4.5),
        avoidedEmissionsCarMiles: Math.round(amount * 350)
      };
    } else if (transaction.category === "Energy Credit") {
      return {
        megawattHoursProduced: Number((amount * 0.12).toFixed(2)),
        homesPoweredDaily: Math.round(amount * 2.8),
        co2AvoidedKg: Math.round(amount * 52)
      };
    } else if (transaction.category === "Waste Management") {
      return {
        wasteRecycledTons: Number((amount * 0.08).toFixed(2)),
        landfillAvoidedCubicMeters: Math.round(amount * 1.5),
        circularEfficiencyIndex: "88%"
      };
    } else {
      return {
        recCertificatesCreated: Math.round(amount * 1.0),
        gridPurityRate: "99.2%"
      };
    }
  }
}

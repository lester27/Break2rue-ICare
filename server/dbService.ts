/**
 * DB Service — Lightweight JSON database handler.
 *
 * Reads hospital_db.json and provides accessors for the backend.
 */

import { createRequire } from "module";
import { Hospital } from "./excelService.js";

const require = createRequire(import.meta.url);

export { Hospital, Doctor } from "./excelService.js";

let hospitalCache: Hospital[] | null = null;

/**
 * Robustly loads the hospital database.
 * On Vercel, we prefer direct requires or specific paths.
 */
export function initExcelService(): void {
  try {
    // Attempt to load from multiple potential locations
    // 1. Relative to this file (most robust for Vercel/Bundlers)
    try {
      hospitalCache = require("../public/hospital_db.json");
      console.log("[DBService] Loaded from ../public/hospital_db.json");
    } catch (e) {
      // 2. Fallback to root-relative (sometimes works on Vercel)
      hospitalCache = require("../../public/hospital_db.json");
      console.log("[DBService] Loaded from ../../public/hospital_db.json");
    }

    if (hospitalCache && !Array.isArray(hospitalCache)) {
      // Handle cases where JSON might be wrapped in a default object
      if ((hospitalCache as any).default) {
        hospitalCache = (hospitalCache as any).default;
      }
    }

    console.log(`[DBService] Successfully initialized with ${hospitalCache?.length} hospitals`);
  } catch (err: any) {
    console.error("[DBService] Critical Load failed:", err.message);
    hospitalCache = [];
  }
}

export function getHospitals(): Hospital[] {
  if (!hospitalCache) {
    initExcelService();
  }
  return [...(hospitalCache || [])];
}

export function findHospitalByNumericId(numericId: number): Hospital | undefined {
  return getHospitals().find(h => h.numericId === numericId);
}

export function findHospitalById(id: string): Hospital | undefined {
  return getHospitals().find(h => h.id === id || String(h.numericId) === id);
}

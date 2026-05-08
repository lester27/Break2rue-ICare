/**
 * DB Service — Lightweight JSON database handler.
 *
 * Reads hospital_db.json and provides accessors for the backend.
 */

<<<<<<< HEAD
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
=======
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Doctor {
  name: string;
  type: string;
  department: string;
  schedule: string;
  priceRange: string;
  hmos: string[];
  contact: string;
}

export interface Hospital {
  id: string;
  numericId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  referenceKey: string;
  level: string;
  doctors: Doctor[];
}

let hospitalCache: Hospital[] | null = null;

function resolveJsonPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "public", "hospital_db.json"),
    path.resolve(process.cwd(), "data", "hospital_db.json"),
    path.resolve(process.cwd(), "hospital_db.json"),
    path.join(__dirname, "..", "public", "hospital_db.json"),
    path.join(__dirname, "..", "data", "hospital_db.json"),
    path.join(__dirname, "data", "hospital_db.json"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "hospital_db.json"),
    "/var/task/public/hospital_db.json",
    "/var/task/data/hospital_db.json"
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[DBService] Found JSON database at: ${candidate}`);
      return candidate;
    }
  }

  throw new Error("hospital_db.json not found");
}

export function initExcelService(): void {
  // Keeping the function name same for compatibility with server.ts temporarily
  try {
    const filePath = resolveJsonPath();
    const raw = fs.readFileSync(filePath, "utf-8");
    hospitalCache = JSON.parse(raw);
    console.log(`[DBService] Loaded ${hospitalCache?.length} hospitals from JSON`);
  } catch (err: any) {
    console.error("[DBService] Load failed:", err.message);
>>>>>>> d6bb4c9cb3128149a01394e179698dc52d2a34f6
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

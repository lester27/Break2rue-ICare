/**
 * ExcelService — Ported from com.icare.service.ExcelService (Java)
 *
 * Reads Hospital_DB.xlsx, parses the Reference Table for hospitals and
 * individual doctor sheets, links doctors to hospitals via reference key,
 * and caches everything in memory.
 */

import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

// ─── Interfaces ──────────────────────────────────────────────────

export interface Doctor {
  id: number;
  name: string;
  type: string;
  department: string;
  schedule: string;
  priceRange: string;
  hmos: string[];
  contact: string;
  secretary: string;
  tags: string[];
}

export interface Hospital {
  id: string;
  numericId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  contactNumber: string;
  operatingHours: string;
  philHealthStatus: string;
  referenceKey: string;
  level: string;
  doctors: Doctor[];
}

// ─── Constants ───────────────────────────────────────────────────

const REFERENCE_SHEET_NAME = "Reference Table";

// ─── Cache ───────────────────────────────────────────────────────

let hospitalCache: Hospital[] | null = null;

// ─── Header Normalization ────────────────────────────────────────

function normalizeHeader(raw: string): string {
  return (raw || "").toLowerCase().replace(/[\s_\-]/g, "");
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// ─── Safe Cell Readers ───────────────────────────────────────────

function safeString(cell: any): string {
  if (!cell) return "";
  if (cell.t === "s") return String(cell.v ?? "").trim();
  if (cell.t === "n") return String(cell.v ?? "").trim();
  if (cell.t === "b") return String(cell.v ?? "").trim();
  return "";
}

function safeDouble(cell: any): number {
  if (!cell) return 0.0;
  if (cell.t === "n") return Number(cell.v) || 0.0;
  const text = safeString(cell);
  if (!text) return 0.0;
  const parsed = parseFloat(text);
  return isNaN(parsed) ? 0.0 : parsed;
}

// ─── Column Index Lookup ─────────────────────────────────────────

function getColumnIndex(headers: string[], fieldName: string, fallback: number): number {
  const idx = headers.indexOf(fieldName);
  return idx >= 0 ? idx : fallback;
}

function buildHeaderNames(sheet: any, row: number): string[] {
  const headers: string[] = [];
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    headers.push(normalizeHeader(safeString(sheet[addr])));
  }
  return headers;
}

function getCellAt(sheet: any, row: number, col: number): any {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  return sheet[addr];
}

// ─── HMO Parsing ─────────────────────────────────────────────────

function parseHmos(cell: any): string[] {
  const raw = safeString(cell);
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(s => s.length > 0);
}

// ─── Doctor Tag Builder ──────────────────────────────────────────

function buildDoctorTags(department: string, specializations: string, type: string): string[] {
  const tags: string[] = [];

  if (department && department.trim()) {
    department.split(",").map(s => s.trim()).filter(s => s).forEach(s => tags.push(normalizeTag(s)));
  }
  if (specializations && specializations.trim()) {
    specializations.split(",").map(s => s.trim()).filter(s => s).forEach(s => tags.push(normalizeTag(s)));
  }
  if (type && type.trim()) {
    tags.push(normalizeTag(type));
  }
  if (tags.length === 0) {
    tags.push("general");
  }

  return [...new Set(tags)];
}

// ─── Doctor ID Generator ─────────────────────────────────────────

function generateDoctorId(sheetName: string, name: string, department: string): number {
  // Simple hash to replicate Java's Objects.hash()
  let hash = 0;
  const str = `${sheetName}:${name}:${department}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Hospital Services Builder ───────────────────────────────────

function buildHospitalServices(doctors: Doctor[], hospitalType: string): string[] {
  if (!doctors || doctors.length === 0) {
    return [hospitalType && hospitalType.trim() ? hospitalType : "General"];
  }
  const departments = doctors
    .map(d => d.department)
    .filter(d => d && d.trim())
    .map(d => d.trim());
  return [...new Set(departments)];
}

// ─── Sheet Parsers ───────────────────────────────────────────────

function isDoctorSheet(sheet: any): boolean {
  const headers = buildHeaderNames(sheet, 0);
  const first = headers[0] || "";
  return first.includes("nameofdoctor") || first.includes("doctor");
}

function parseDoctorSheet(sheet: any, sheetName: string): Doctor[] {
  const headers = buildHeaderNames(sheet, 0);
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const doctors: Doctor[] = [];

  for (let row = 1; row <= range.e.r; row++) {
    const nameCol = getColumnIndex(headers, "nameofdoctor", 0);
    const name = safeString(getCellAt(sheet, row, nameCol));
    if (!name) continue;

    const typeCol = getColumnIndex(headers, "typeofdoctor", 1);
    const deptCol = getColumnIndex(headers, "department", 2);
    const otherSpecCol = getColumnIndex(headers, "otherspecializations", 3);
    const schedCol = getColumnIndex(headers, "schedule", 4);
    const priceCol = getColumnIndex(headers, "price", 7);
    const hmoCol = getColumnIndex(headers, "hmos", 6);
    const contactCol = getColumnIndex(headers, "contactnumber", 9);
    const secCol = getColumnIndex(headers, "medicalsecretary", 8);

    const department = safeString(getCellAt(sheet, row, deptCol));
    const otherSpecializations = safeString(getCellAt(sheet, row, otherSpecCol));
    let type = safeString(getCellAt(sheet, row, typeCol));
    if (!type) type = "General Practitioner";

    const doctor: Doctor = {
      id: generateDoctorId(sheetName, name, department),
      name,
      type,
      department,
      schedule: safeString(getCellAt(sheet, row, schedCol)),
      priceRange: safeString(getCellAt(sheet, row, priceCol)),
      hmos: parseHmos(getCellAt(sheet, row, hmoCol)),
      contact: safeString(getCellAt(sheet, row, contactCol)),
      secretary: safeString(getCellAt(sheet, row, secCol)),
      tags: buildDoctorTags(department, otherSpecializations, type),
    };

    doctors.push(doctor);
  }

  return doctors;
}

function isReferenceRowEmpty(sheet: any, row: number, maxCol: number): boolean {
  for (let col = 0; col <= maxCol; col++) {
    if (safeString(getCellAt(sheet, row, col)).trim()) return false;
  }
  return true;
}

// ─── Main Loading Logic ──────────────────────────────────────────

function resolveXlsxPath(): string {
  const isVercel = !!process.env.VERCEL;
  console.log(`[ExcelService] Detecting environment... (Vercel: ${isVercel}, CWD: ${process.cwd()})`);
  
  // Try multiple locations for maximum flexibility across local and cloud environments
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "data", "Hospital_DB.xlsx"),
    path.resolve(process.cwd(), "Hospital_DB.xlsx"),
    path.resolve(currentDir, "..", "data", "Hospital_DB.xlsx"),
    path.resolve(currentDir, "..", "..", "data", "Hospital_DB.xlsx"), // deep nested fallback
    "/var/task/data/Hospital_DB.xlsx" // common Vercel absolute path
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[ExcelService] Found database at: ${candidate}`);
      return candidate;
    }
  }

  const searchedPaths = candidates.join("\n- ");
  throw new Error(
    `CRITICAL: Hospital_DB.xlsx not found. Ensure it is in the 'data/' folder at your project root.\nSearched paths:\n- ${searchedPaths}`
  );
}

function loadHospitals(): Hospital[] {
  const filePath = resolveXlsxPath();
  console.log(`[ExcelService] Loading hospital data from: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetMap = new Map<string, any>();

  for (const name of workbook.SheetNames) {
    sheetMap.set(name.trim(), workbook.Sheets[name]);
  }

  // Find reference sheet
  let referenceSheet: any = null;
  let referenceSheetName = "";

  if (sheetMap.has(REFERENCE_SHEET_NAME)) {
    referenceSheet = sheetMap.get(REFERENCE_SHEET_NAME)!;
    referenceSheetName = REFERENCE_SHEET_NAME;
  } else {
    // Fallback: find sheet with healthcare facility header
    for (const [name, sheet] of sheetMap.entries()) {
      const headers = buildHeaderNames(sheet, 0);
      if (headers[0]?.includes("nameofhealthcarefacility") || headers[0]?.includes("healthcarefacility")) {
        referenceSheet = sheet;
        referenceSheetName = name;
        break;
      }
    }
  }

  if (!referenceSheet) {
    console.warn("[ExcelService] No reference sheet found in workbook");
    return [];
  }

  // Parse doctor sheets
  const doctorsByReference = new Map<string, Doctor[]>();
  for (const [name, sheet] of sheetMap.entries()) {
    if (name === referenceSheetName) continue;
    if (isDoctorSheet(sheet)) {
      const doctors = parseDoctorSheet(sheet, name);
      if (doctors.length > 0) {
        doctorsByReference.set(name, doctors);
      }
    }
  }

  // Parse reference table
  const headers = buildHeaderNames(referenceSheet, 0);
  const range = XLSX.utils.decode_range(referenceSheet["!ref"] || "A1");
  const hospitals: Hospital[] = [];

  for (let row = 1; row <= range.e.r; row++) {
    if (isReferenceRowEmpty(referenceSheet, row, range.e.c)) continue;

    const refKeyCol = getColumnIndex(headers, "referencekey", 5);
    const referenceKey = safeString(getCellAt(referenceSheet, row, refKeyCol));

    let name = safeString(getCellAt(referenceSheet, row, getColumnIndex(headers, "nameofhealthcarefacility", 0)));
    if (!name) {
      name = safeString(getCellAt(referenceSheet, row, getColumnIndex(headers, "name", 0)));
    }
    if (!name) continue;

    const type = safeString(getCellAt(referenceSheet, row, getColumnIndex(headers, "type", 1)));
    const level = safeString(getCellAt(referenceSheet, row, getColumnIndex(headers, "level", 2)));
    const latitude = safeDouble(getCellAt(referenceSheet, row, getColumnIndex(headers, "latitude", 3)));
    const longitude = safeDouble(getCellAt(referenceSheet, row, getColumnIndex(headers, "longitude", 4)));
    const address = safeString(getCellAt(referenceSheet, row, getColumnIndex(headers, "address", 2)));

    // Skip rows with no valid coordinates
    if (latitude === 0.0 && longitude === 0.0) continue;

    const doctors = doctorsByReference.get(referenceKey) || [];
    const services = buildHospitalServices(doctors, type);

    const hospital: Hospital = {
      id: referenceKey || String(row),
      numericId: row,
      name,
      address,
      latitude,
      longitude,
      services,
      contactNumber: "",
      operatingHours: "",
      philHealthStatus: "",
      referenceKey,
      level,
      doctors,
    };

    hospitals.push(hospital);
  }

  console.log(`[ExcelService] Loaded ${hospitals.length} hospitals, ${doctorsByReference.size} doctor sheets`);
  return hospitals;
}

// ─── Public API ──────────────────────────────────────────────────

export function initExcelService(): void {
  hospitalCache = loadHospitals();
}

export function getHospitals(): Hospital[] {
  if (!hospitalCache) {
    hospitalCache = loadHospitals();
  }
  return [...hospitalCache];
}

export function findHospitalById(hospitalId: string): Hospital | undefined {
  return getHospitals().find(
    h => h.id === hospitalId || String(h.numericId) === hospitalId
  );
}

export function findHospitalByNumericId(numericId: number): Hospital | undefined {
  return getHospitals().find(h => h.numericId === numericId);
}

export function findDoctorsByHospitalNumericId(numericId: number): Doctor[] {
  const hospital = findHospitalByNumericId(numericId);
  return hospital?.doctors || [];
}

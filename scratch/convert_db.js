import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const excelPath = path.resolve(process.cwd(), "data", "Hospital_DB.xlsx");
const jsonPath = path.resolve(process.cwd(), "data", "hospital_db.json");

function safeString(cell) {
  if (!cell) return "";
  return String(cell.v ?? "").trim();
}

function safeDouble(cell) {
  if (!cell) return 0.0;
  return Number(cell.v) || 0.0;
}

function normalizeHeader(raw) {
  return (raw || "").toLowerCase().replace(/[\s_\-]/g, "");
}

function convert() {
  console.log("Reading Excel from:", excelPath);
  const workbook = XLSX.readFile(excelPath);
  const sheetMap = new Map();
  for (const name of workbook.SheetNames) {
    sheetMap.set(name.trim(), workbook.Sheets[name]);
  }

  const referenceSheet = sheetMap.get("Reference Table");
  if (!referenceSheet) throw new Error("No Reference Table found");

  const range = XLSX.utils.decode_range(referenceSheet["!ref"]);
  const headers = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: col });
    headers.push(normalizeHeader(safeString(referenceSheet[addr])));
  }

  const hospitals = [];
  for (let row = 1; row <= range.e.r; row++) {
    const name = safeString(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 0 })]);
    if (!name) continue;

    const refKey = safeString(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 5 })]);
    const lat = safeDouble(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 3 })]);
    const lng = safeDouble(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 4 })]);

    // Doctors
    const doctors = [];
    const docSheet = sheetMap.get(refKey);
    if (docSheet) {
      const dRange = XLSX.utils.decode_range(docSheet["!ref"]);
      const dHeaders = [];
      for (let col = dRange.s.c; col <= dRange.e.c; col++) {
        dHeaders.push(normalizeHeader(safeString(docSheet[XLSX.utils.encode_cell({ r: 0, c: col })])));
      }

      for (let r = 1; r <= dRange.e.r; r++) {
        const dName = safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 0 })]);
        if (!dName) continue;
        doctors.push({
          name: dName,
          type: safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 1 })]) || "General Practitioner",
          department: safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 2 })]),
          schedule: safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 4 })]),
          priceRange: safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 7 })]),
          contact: safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 9 })]),
          hmos: (safeString(docSheet[XLSX.utils.encode_cell({ r: r, c: 6 })]) || "").split(",").map(s => s.trim()).filter(s => s)
        });
      }
    }

    hospitals.push({
      id: refKey || String(row),
      numericId: row,
      name,
      address: safeString(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 2 })]),
      latitude: lat,
      longitude: lng,
      services: [...new Set(doctors.map(d => d.department).filter(d => d))],
      referenceKey: refKey,
      level: safeString(referenceSheet[XLSX.utils.encode_cell({ r: row, c: 2 })]),
      doctors
    });
  }

  fs.writeFileSync(jsonPath, JSON.stringify(hospitals, null, 2));
  console.log("Converted to JSON:", jsonPath);
}

convert();

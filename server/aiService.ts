/**
 * AIService — Ported from com.icare.service.AIService (Java)
 *
 * Keyword-based symptom→specialty mapping and offline hospital triage.
 * Uses the real hospital data from ExcelService.
 */

import { Hospital, Doctor, getHospitals } from "./dbService.js";
import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────

interface TriageCase {
  id: string;
  complaint: string;
  branches: Array<{
    id: string;
    condition: string;
    severity: number[];
    triage: number;
    spec: string;
    action: string;
  }>;
}

interface TriageData {
  cases: TriageCase[];
  triage_levels: Array<{ code: number; label: string; color: string }>;
  red_flags: Array<{ id: string; text: string; escalate: number }>;
}

interface SpecialtiesData {
  specs: Record<string, string>;
}

// ─── Symptom → Specialty Rules ───────────────────────────────────

const SYMPTOM_SPECIALTY_RULES: [string, string][] = [
  ["chest pain", "Cardiology"],
  ["heart", "Cardiology"],
  ["shortness of breath", "Pulmonology"],
  ["difficulty breathing", "Pulmonology"],
  ["breath", "Pulmonology"],
  ["fever", "Internal Medicine"],
  ["cough", "Internal Medicine"],
  ["infection", "Internal Medicine"],
  ["headache", "Neurology"],
  ["migraine", "Neurology"],
  ["stomach", "Gastroenterology"],
  ["abdominal", "Gastroenterology"],
  ["nausea", "Gastroenterology"],
  ["dizzy", "General Practice"],
  ["other", "General Practice"],
];

// ─── Specialty Keywords ──────────────────────────────────────────

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  cardiology: ["cardiology", "cardiac", "heart", "cardio"],
  pulmonology: ["pulmonology", "pulmonary", "respiratory", "lung", "lungs", "breathing"],
  "internal medicine": ["internal medicine", "internal", "general medicine", "medicine", "general internal"],
  neurology: ["neurology", "neuro", "brain", "headache", "migraine", "nerve", "stroke"],
  gastroenterology: ["gastroenterology", "gastro", "digestive", "stomach", "abdominal", "nausea", "gut", "bowel"],
  "general practice": ["general practice", "general", "family", "primary", "primary care", "gp", "family medicine", "general medicine"],
};

// ─── JSON Data Loading ───────────────────────────────────────────

let triageData: TriageData | null = null;
let specialtiesData: SpecialtiesData | null = null;

function loadJsonFile<T>(filename: string): T | null {
  const candidates = [
    path.resolve(process.cwd(), "src", "data", filename),
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), "..", filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, "utf-8");
      return JSON.parse(content) as T;
    }
  }

  console.warn(`[AIService] Could not find ${filename}`);
  return null;
}

function ensureDataLoaded(): void {
  if (!triageData) {
    triageData = loadJsonFile<TriageData>("triage.json");
  }
  if (!specialtiesData) {
    specialtiesData = loadJsonFile<SpecialtiesData>("specialties.json");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function getKeywordsForSpecialty(specialty: string): string[] {
  if (!specialty) return [];
  return SPECIALTY_KEYWORDS[specialty.toLowerCase()] || [specialty.toLowerCase()];
}

function matchesAnyKeyword(target: string | undefined, keywords: string[]): boolean {
  if (!target?.trim()) return false;
  const normalized = target.toLowerCase();
  return keywords.some(kw => kw && normalized.includes(kw));
}

function mapSymptomToSpecialty(symptoms: string): string {
  const normalized = (symptoms || "").toLowerCase();
  if (!normalized) return "General Practice";

  for (const [keyword, specialty] of SYMPTOM_SPECIALTY_RULES) {
    if (normalized.includes(keyword)) {
      return specialty;
    }
  }
  return "General Practice";
}

function matchesHospitalSpecialty(hospital: Hospital, lowerSpecialty: string, _lowerSymptoms: string): boolean {
  const keywords = getKeywordsForSpecialty(lowerSpecialty);

  // Check hospital services
  if (hospital.services?.some(service => matchesAnyKeyword(service, keywords))) {
    return true;
  }

  // Check hospital doctors
  if (hospital.doctors) {
    for (const doctor of hospital.doctors) {
      if (!doctor) continue;
      if (matchesAnyKeyword(doctor.department, keywords)) return true;
      if (matchesAnyKeyword(doctor.type, keywords)) return true;
      if (doctor.tags?.some(tag => matchesAnyKeyword(tag, keywords))) return true;
    }
  }

  return false;
}

function findHospitalsForSpecialty(specialty: string, symptoms: string): Hospital[] {
  const lowerSpecialty = specialty.toLowerCase();
  const lowerSymptoms = (symptoms || "").toLowerCase();
  return getHospitals().filter(h => matchesHospitalSpecialty(h, lowerSpecialty, lowerSymptoms));
}

function buildHospitalSummary(hospital: Hospital): Record<string, unknown> {
  return {
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    type: hospital.level?.trim() || "Hospital",
    lat: hospital.latitude,
    lng: hospital.longitude,
    specializations: hospital.services || [],
    contactNumber: hospital.contactNumber,
    doctors: hospital.doctors
      .map(d => d.name)
      .filter(Boolean)
      .slice(0, 3),
  };
}

// ─── Public API ──────────────────────────────────────────────────

export function getTriageResponse(userInput: string): string {
  ensureDataLoaded();

  if (triageData?.cases) {
    for (const triageCase of triageData.cases) {
      const complaint = triageCase.complaint.toLowerCase();
      if (userInput.toLowerCase().includes(complaint)) {
        const branch = triageCase.branches[0];
        return (
          `Based on your symptoms, this seems ${branch.condition}. ` +
          `Recommended action: ${branch.action}. ` +
          `Specialty: ${getSpecialtyName(branch.spec)}`
        );
      }
    }
  }

  return "Please provide more details about your symptoms.";
}

export function getSpecialtyName(specId: string): string {
  ensureDataLoaded();
  if (specialtiesData?.specs && specId in specialtiesData.specs) {
    return specialtiesData.specs[specId];
  }
  return "General Practitioner";
}

export function offlineTriage(symptoms: string): Record<string, unknown> {
  const cleaned = (symptoms || "").trim();
  const specialty = mapSymptomToSpecialty(cleaned);
  const matchedHospitals = findHospitalsForSpecialty(specialty, cleaned);

  if (matchedHospitals.length > 0) {
    return {
      reply: "These are the suited hospitals for that section. All recommendations are based on the loaded hospital database.",
      specialty,
      location: "Hospital database region",
      hospitals: matchedHospitals.map(buildHospitalSummary),
      found: true,
    };
  }

  return {
    reply: "The specific specialist or hospital for this condition may not be available in the current hospital database.",
    hospitals: [],
    found: false,
  };
}

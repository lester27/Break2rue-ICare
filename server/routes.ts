/**
 * API Routes — Ported from ApiController, ChatController, MatchController (Java)
 *
 * Express router exposing all REST endpoints for the iCare+ platform.
 */

import { Router, Request, Response } from "express";
import {
  getHospitals,
  findHospitalByNumericId,
  findHospitalById,
  Hospital,
  Doctor,
} from "./dbService.js";
import {
  findNearbyHospitals,
  findMatchingHospitals,
  HospitalMatch,
  UserProfile,
} from "./matchingEngine.js";
import {
  offlineTriage,
  getTriageResponse,
} from "./aiService.js";

// ─── Types ───────────────────────────────────────────────────────

interface HospitalCard {
  id: number;
  name: string;
  type: string;
  address: string;
  distance: string;
  travel: string;
  status: string;
  specializations: string[];
  directoryUrl: string;
  tags: string[];
  pinX: string;
  pinY: string;
  lat: number;
  lng: number;
}

interface UserHealthProfile {
  name?: string;
  email?: string;
  height?: string;
  weight?: string;
  bmi?: string;
  age?: string;
  sex?: string;
  bloodType?: string;
  conditions?: string[];
  otherConditions?: string;
  allergies?: string;
  medications?: string;
  smoking?: string;
  alcohol?: string;
  emergencyContact?: string;
}

interface ChatRequest {
  message?: string;
  userProfile?: UserHealthProfile;
  userLat?: number;
  userLng?: number;
}

// ─── In-memory Profile Store ─────────────────────────────────────

let storedProfile: UserHealthProfile | null = null;

// ─── Constants ───────────────────────────────────────────────────

const MIN_LAT = 9.6400;
const MAX_LAT = 9.6700;
const MIN_LNG = 123.8400;
const MAX_LNG = 123.8600;

// ─── Helpers ─────────────────────────────────────────────────────

function toPercent(value: number, min: number, max: number): string {
  const clipped = Math.max(min, Math.min(max, value));
  const percent = ((clipped - min) / (max - min)) * 100.0;
  return `${percent.toFixed(1)}%`;
}

function determineHospitalType(hospital: Hospital): string {
  const name = (hospital.name || "").toLowerCase();
  if (name.includes("city") || name.includes("government") || name.includes("regional") || name.includes("municipal")) {
    return "Government Hospital";
  }
  return "Private Hospital";
}

function computeTravelTime(distanceKm: number): string {
  const minutes = Math.max(5, Math.round(distanceKm * 4.5));
  return `${minutes} min`;
}

function computeStatus(hospital: Hospital): string {
  const hours = hospital.operatingHours;
  if (hours && hours.toLowerCase().includes("24/7")) return "Open 24/7";
  return hours && hours.trim() ? hours : "Open";
}

function generateTags(hospital: Hospital): string[] {
  if (!hospital.services?.length) return ["general"];
  return hospital.services
    .filter(s => s?.trim())
    .map(s => s.trim().toLowerCase().replace(/ /g, "-"));
}

function toHospitalCard(hospital: Hospital, distanceKm: number): HospitalCard {
  return {
    id: hospital.numericId ?? 0,
    name: hospital.name,
    type: determineHospitalType(hospital),
    address: hospital.address,
    distance: `${distanceKm.toFixed(1)} km`,
    travel: computeTravelTime(distanceKm),
    status: computeStatus(hospital),
    specializations: hospital.services,
    directoryUrl: "#",
    tags: generateTags(hospital),
    lat: hospital.latitude,
    lng: hospital.longitude,
    pinX: toPercent(hospital.longitude, MIN_LNG, MAX_LNG),
    pinY: toPercent(MAX_LAT - hospital.latitude, 0, MAX_LAT - MIN_LAT),
  };
}

function extractTags(message: string): string[] {
  if (!message?.trim()) return [];
  const lower = message.toLowerCase();
  const tags = new Set<string>();

  if (lower.includes("cardio") || lower.includes("heart") || lower.includes("chest")) tags.add("cardiology");
  if (lower.includes("pediatric") || lower.includes("child") || lower.includes("baby")) tags.add("pediatrics");
  if (lower.includes("cancer") || lower.includes("oncology")) tags.add("oncology");
  if (lower.includes("emergency") || lower.includes("urgent") || lower.includes("accident")) tags.add("emergency");
  if (lower.includes("respir") || lower.includes("fever") || lower.includes("cough") || lower.includes("asthma")) tags.add("general");

  return [...tags];
}

function buildChatReply(message: string, _tags: string[]): string {
  const lower = message.toLowerCase();
  if (lower.includes("heart") || lower.includes("cardio") || lower.includes("chest")) {
    return "I recommend seeing a cardiology specialist soon. Here are nearby hospitals with cardiology support.";
  }
  if (lower.includes("child") || lower.includes("pediatric")) {
    return "These nearby hospitals offer pediatric care and emergency support for children.";
  }
  if (lower.includes("emergency") || lower.includes("urgent") || lower.includes("accident")) {
    return "This looks urgent. Please use the nearest hospital with 24/7 emergency services.";
  }
  if (_tags.length === 0) {
    return "Based on your location, here are nearby hospitals that may be able to help.";
  }
  return "I found hospitals matching your concern. Please review the recommendations and tap a hospital for details.";
}

// ─── Router ──────────────────────────────────────────────────────

const router = Router();

// GET /api/hospitals/center
router.get("/hospitals/center", (_req: Request, res: Response) => {
  const all = getHospitals().filter(h => h.latitude !== 0.0 && h.longitude !== 0.0);

  if (all.length === 0) {
    res.json({ lat: 9.6412, lng: 123.8566 });
    return;
  }

  const avgLat = all.reduce((sum, h) => sum + h.latitude, 0) / all.length;
  const avgLng = all.reduce((sum, h) => sum + h.longitude, 0) / all.length;
  res.json({ lat: avgLat, lng: avgLng });
});

// GET /api/hospitals/nearby
router.get("/hospitals/nearby", (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseInt(req.query.radius as string) || 10;
  const limit = parseInt(req.query.limit as string) || 6;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const matches = findNearbyHospitals(lat, lng, radiusKm, limit);
  const cards = matches.map(m => toHospitalCard(m.hospital, m.distanceKm));
  res.json(cards);
});

// GET /api/hospitals/:id/doctors
router.get("/hospitals/:id/doctors", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid hospital ID" });
    return;
  }

  const hospital = findHospitalByNumericId(id);
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }

  res.json(hospital.doctors);
});

// POST /api/users/profile
router.post("/users/profile", (req: Request, res: Response) => {
  const profile = req.body as UserHealthProfile;
  if (!profile) {
    res.status(400).json({ error: "Profile is required" });
    return;
  }
  storedProfile = profile;
  res.json({ success: true });
});

// GET /api/users/profile
router.get("/users/profile", (_req: Request, res: Response) => {
  if (storedProfile) {
    res.json(storedProfile);
  } else {
    res.status(204).send();
  }
});

// POST /api/chat
router.post("/chat", (req: Request, res: Response) => {
  const request = req.body as ChatRequest;
  if (!request?.message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const lat = request.userLat ?? 9.6461;
  const lng = request.userLng ?? 123.8519;
  const tags = extractTags(request.message);

  let hospitals = findNearbyHospitals(lat, lng, 10, 6)
    .map(m => toHospitalCard(m.hospital, m.distanceKm))
    .filter(card => tags.length === 0 || card.tags.some(t => tags.includes(t)));

  if (hospitals.length === 0) {
    hospitals = findNearbyHospitals(lat, lng, 20, 6)
      .map(m => toHospitalCard(m.hospital, m.distanceKm));
  }

  const reply = buildChatReply(request.message, tags);
  res.json({ reply, hospitals, tags });
});

// POST /api/chat/health-form
router.post("/chat/health-form", (req: Request, res: Response) => {
  const request = req.body as ChatRequest;
  let reply = "Thanks for sharing your health details. I can help you understand your profile and recommend what to do next.";

  if (request?.userProfile?.bloodType?.trim()) {
    reply = `I see your blood type is ${request.userProfile.bloodType}. Keep it handy during emergencies. ` +
      "If you want, I can also suggest hospitals that accept PhilHealth and emergency care near you.";
  }

  res.json({ reply, hospitals: [], tags: [] });
});

// POST /api/chat/message (from ChatController)
router.post("/chat/message", (req: Request, res: Response) => {
  const { message, offline } = req.body as { message?: string; offline?: boolean | string };
  const isOffline = offline === true || offline === "true";

  if (isOffline) {
    res.json(offlineTriage(message || ""));
    return;
  }

  try {
    const triage = getTriageResponse(message || "");
    // In the future, this would call Gemini API; for now, return triage response
    res.json({
      message: triage,
      mode: "online",
    });
  } catch (e) {
    res.json({
      message: "AI service failed. Switching to offline mode.",
      options: ["Chest pain", "Fever", "Headache", "Shortness of breath", "Abdominal pain", "Other"],
      mode: "offline",
      autoSwitch: true,
    });
  }
});

// POST /api/chat/offline/select (from ChatController)
router.post("/chat/offline/select", (req: Request, res: Response) => {
  const { symptom } = req.body as { symptom?: string };
  if (!symptom?.trim()) {
    res.json({
      reply: "Please type your symptom or condition so we can search the Tagbilaran, Bohol database.",
      hospitals: [],
      found: false,
    });
    return;
  }
  res.json(offlineTriage(symptom));
});

// POST /api/match (from MatchController)
router.post("/match", (req: Request, res: Response) => {
  const profile = req.body as UserProfile;
  if (!profile) {
    res.status(400).json({ error: "User profile is required" });
    return;
  }
  const matches = findMatchingHospitals(profile);
  res.json(matches);
});

// GET /api/hospital/:id (from MatchController)
router.get("/hospital/:id", (req: Request, res: Response) => {
  const hospital = findHospitalById(req.params.id);
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }
  res.json(hospital);
});

export default router;

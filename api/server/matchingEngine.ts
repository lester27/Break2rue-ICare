/**
 * MatchingEngine — Ported from com.icare.service.MatchingEngine (Java)
 *
 * Haversine distance calculation and hospital matching/scoring.
 */

import { Hospital, getHospitals } from "./dbService.js";

// ─── Distance Calculator (ported from DistanceCalculator.java) ───

const EARTH_RADIUS_KM = 6371.0;

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const latDelta = toRad(lat2 - lat1);
  const lonDelta = toRad(lng2 - lng1);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ─── Types ───────────────────────────────────────────────────────

export interface HospitalMatch {
  hospital: Hospital;
  distanceKm: number;
  suitabilityScore: number;
}

export interface UserProfile {
  latitude: number;
  longitude: number;
  chronicConditions?: string[];
  allergies?: string[];
  medications?: string[];
  bloodType?: string;
}

// ─── Condition → Service Mapping ─────────────────────────────────

const CONDITION_TO_SERVICE: Record<string, string> = {
  kidney: "Dialysis",
  diabetes: "Endocrinology",
  heart: "Cardiology",
  maternal: "Maternity",
  pregnancy: "Maternity",
  pediatrics: "Pediatrics",
  fever: "Internal Medicine",
  respiratory: "Pulmonology",
  wound: "Emergency",
  stroke: "Neurology",
};

// ─── Scoring ─────────────────────────────────────────────────────

function calculateSuitabilityScore(distanceKm: number, matchingKeywords: number): number {
  const distanceScore = Math.max(0.0, 100.0 - distanceKm * 3.0);
  const relevanceBonus = matchingKeywords * 20.0;
  return Math.round((distanceScore + relevanceBonus) * 100.0) / 100.0;
}

function countMatchingServices(hospital: Hospital, needs: Set<string>): number {
  if (!hospital.services?.length || needs.size === 0) return 0;

  let count = 0;
  for (const service of hospital.services) {
    if (!service) continue;
    const normalizedService = service.toLowerCase();
    for (const need of needs) {
      if (normalizedService.includes(need) || need.includes(normalizedService)) {
        count++;
        break;
      }
      const mappedService = CONDITION_TO_SERVICE[need];
      if (mappedService && normalizedService.includes(mappedService.toLowerCase())) {
        count++;
        break;
      }
    }
  }
  return count;
}

function buildSearchTerms(profile: UserProfile): Set<string> {
  const terms = new Set<string>();
  profile.chronicConditions?.forEach(c => { if (c?.trim()) terms.add(c.trim().toLowerCase()); });
  profile.allergies?.forEach(a => { if (a?.trim()) terms.add(a.trim().toLowerCase()); });
  profile.medications?.forEach(m => { if (m?.trim()) terms.add(m.trim().toLowerCase()); });
  if (profile.bloodType?.trim()) terms.add(profile.bloodType.trim().toUpperCase());
  return terms;
}

// ─── Public API ──────────────────────────────────────────────────

export function findNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 6
): HospitalMatch[] {
  const hospitals = getHospitals();

  return hospitals
    .map(hospital => ({
      hospital,
      distanceKm: haversineDistance(latitude, longitude, hospital.latitude, hospital.longitude),
      suitabilityScore: 0,
    }))
    .filter(match => match.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function findMatchingHospitals(profile: UserProfile): HospitalMatch[] {
  const hospitals = getHospitals();
  if (!hospitals.length) return [];

  const normalizedNeeds = buildSearchTerms(profile);

  return hospitals
    .map(hospital => {
      const distanceKm = haversineDistance(profile.latitude, profile.longitude, hospital.latitude, hospital.longitude);
      const matchingKeywords = countMatchingServices(hospital, normalizedNeeds);
      const score = calculateSuitabilityScore(distanceKm, matchingKeywords);
      return { hospital, distanceKm, suitabilityScore: score };
    })
    .filter(match => match.suitabilityScore >= 0)
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

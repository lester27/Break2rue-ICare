/**
 * API Service — Frontend client for the iCare+ backend.
 *
 * All functions include error handling and return null/empty on failure
 * so the frontend can gracefully fall back to mock data.
 */

import type { HospitalCard, DoctorRecord, UserProfile, OfflineTriageResponse } from "../types";

const API_BASE = "/api";

// ─── Hospital Endpoints ──────────────────────────────────────────

export async function fetchHospitalsCenter(): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/hospitals/center`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    console.warn("[API] Failed to fetch hospital center");
    return null;
  }
}

export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radius: number = 10,
  limit: number = 10
): Promise<HospitalCard[]> {
  try {
    const res = await fetch(
      `${API_BASE}/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    console.warn("[API] Failed to fetch nearby hospitals");
    return [];
  }
}

export async function fetchDoctorsForHospital(hospitalId: number): Promise<DoctorRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/doctors`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    console.warn("[API] Failed to fetch doctors for hospital", hospitalId);
    return [];
  }
}

// ─── User Profile ────────────────────────────────────────────────

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch {
    console.warn("[API] Failed to save user profile");
    return false;
  }
}

// ─── Chat ────────────────────────────────────────────────────────

export async function sendOfflineChatMessage(message: string): Promise<OfflineTriageResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, offline: true }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    console.warn("[API] Failed to send offline chat message");
    return null;
  }
}

// ─── Health Check ────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/hospitals/center`);
    return res.ok;
  } catch {
    return false;
  }
}

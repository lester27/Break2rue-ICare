export interface Hospital {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  specializations: string[];
  distance?: string;
  travelTime?: string;
  contact?: string;
}

export interface UserProfile {
  name: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  bloodType: string;
  conditions: string[];
  allergies: string;
  medications: string;
}

// ─── Backend API response types ──────────────────────────────────

export interface HospitalCard {
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

export interface DoctorRecord {
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

export interface ChatResponse {
  reply: string;
  hospitals: HospitalCard[];
  tags: string[];
}

export interface OfflineTriageResponse {
  reply: string;
  specialty?: string;
  location?: string;
  hospitals: Array<{
    id: string;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    specializations: string[];
    contactNumber: string;
    doctors: string[];
  }>;
  found: boolean;
}

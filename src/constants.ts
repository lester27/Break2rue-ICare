import { Hospital } from "./types";

export const TAGBILARAN_CENTER = { lat: 9.6526, lng: 123.8566 };

export const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "Governor Celestino Gallares Memorial Medical Center",
    type: "Government Hospital",
    lat: 9.6465,
    lng: 123.8548,
    specializations: ["Emergency", "Surgery", "Internal Medicine", "Pediatrics", "OB-GYN", "Dialysis"],
    contact: "(038) 411 4831"
  },
  {
    id: "h2",
    name: "Ramiro Community Hospital",
    type: "Private Hospital",
    lat: 9.6415,
    lng: 123.8587,
    specializations: ["Cardiology", "Neurology", "Pediatrics", "General Medicine"],
    contact: "(038) 411 3515"
  },
  {
    id: "h3",
    name: "Holy Name University Medical Center",
    type: "Private Hospital",
    lat: 9.6560,
    lng: 123.8612,
    specializations: ["Oncology", "Cardiology", "Emergency", "Modern Diagnostics"],
    contact: "(038) 501 9946"
  },
  {
    id: "h4",
    name: "Bohol St. Jude Hospital",
    type: "Private Hospital",
    lat: 9.6524,
    lng: 123.8590,
    specializations: ["Maternity", "Pediatrics", "Emergency"],
    contact: "(038) 411 3134"
  },
  {
    id: "h5",
    name: "Tagbilaran Community Hospital",
    type: "Private Hospital",
    lat: 9.6496,
    lng: 123.8556,
    specializations: ["General Practice", "Outpatient", "Diagnostics"],
    contact: "(038) 411 3169"
  }
];

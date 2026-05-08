import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import { HospitalCard, DoctorRecord } from "@/types";
import { TAGBILARAN_CENTER } from "@/constants";
import { fetchDoctorsForHospital } from "@/services/apiService";
import { Phone, Navigation, Clock, Users, Stethoscope, Loader2 } from "lucide-react";

// Fix default marker icon issue in Leaflet
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Hospitals
const HospitalIcon = (type: string) => {
  const color = "#f87171"; // Pastel red for better visibility
  return L.divIcon({
    className: "custom-hospital-icon",
    html: `
      <div class="flex items-center justify-center transform -translate-y-1/2 drop-shadow-lg scale-110 transition-transform duration-300 hover:scale-125">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}"/>
          <path d="M14 10H18V14H22V18H18V22H14V18H10V14H14V10Z" fill="white"/>
          <circle cx="16" cy="16" r="14" stroke="white" stroke-width="1" stroke-opacity="0.3"/>
        </svg>
      </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40]
  });
};

const UserLocationIcon = L.divIcon({
  className: "user-location-icon",
  html: `
    <div class="relative flex items-center justify-center transform -translate-y-1/2">
      <div class="absolute h-12 w-12 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="absolute h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/20"></div>
      <svg width="28" height="38" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
        <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="#3b82f6"/>
        <circle cx="16" cy="14" r="6" fill="white"/>
        <path d="M16 22C20 22 24 25 24 28V30H8V28C8 25 12 22 16 22Z" fill="white"/>
      </svg>
    </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40]
});

// Helper component to center map
function ChangeView({ lat, lng, zoom }: { lat: number, lng: number, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

// Doctor list popup sub-component
function DoctorList({ hospitalId }: { hospitalId: number }) {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadDoctors = async () => {
    if (loaded) return;
    setLoading(true);
    const data = await fetchDoctorsForHospital(hospitalId);
    setDoctors(data);
    setLoading(false);
    setLoaded(true);
  };

  if (!loaded) {
    return (
      <button
        onClick={loadDoctors}
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8fd1bd]/20 py-1.5 text-[10px] font-medium text-[#1f4f45] transition-all hover:bg-[#8fd1bd]/40 border border-[#8fd1bd]/30"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Users className="h-3 w-3" />
        )}
        {loading ? "Loading..." : "View Doctors"}
      </button>
    );
  }

  if (doctors.length === 0) {
    return (
      <p className="mt-2 text-[10px] text-[#4a7a6e] italic">No doctor records available</p>
    );
  }

  return (
    <div className="mt-2 max-h-32 overflow-y-auto space-y-1.5">
      <p className="text-[10px] font-bold text-[#1f4f45] uppercase tracking-wider flex items-center gap-1">
        <Stethoscope className="h-3 w-3" /> Doctors ({doctors.length})
      </p>
      {doctors.slice(0, 5).map((doc, i) => (
        <div key={doc.id || i} className="bg-[#f0f9f6] rounded-lg p-2 border border-[#8fd1bd]/20">
          <p className="text-[11px] font-medium text-[#1a3d35]">{doc.name}</p>
          <p className="text-[9px] text-[#4a7a6e]">{doc.department || doc.type}</p>
          {doc.schedule && (
            <p className="text-[9px] text-[#4a7a6e] flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" /> {doc.schedule}
            </p>
          )}
        </div>
      ))}
      {doctors.length > 5 && (
        <p className="text-[9px] text-[#4a7a6e] italic text-center">+{doctors.length - 5} more doctors</p>
      )}
    </div>
  );
}

interface HospitalMapProps {
  hospitals: HospitalCard[];
  isLoading: boolean;
  onShowDetail: (hospital: HospitalCard) => void;
  selectedHospital: HospitalCard | null;
}

export default function HospitalMap({ hospitals, isLoading, onShowDetail, selectedHospital }: HospitalMapProps) {
  // Mock user location in Barangay Cogon, Tagbilaran (Prototype default)
  const [userLocation, setUserLocation] = useState<[number, number] | null>([9.6539, 123.8599]);
  const [hoveredHospital, setHoveredHospital] = useState<HospitalCard | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (h: HospitalCard, e: any) => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const timer = setTimeout(() => {
      setHoveredHospital(h);
    }, 600);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoveredHospital(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="h-full w-full relative" 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#1f4f45] animate-spin" />
            <p className="text-sm font-medium text-[#1f4f45]">Loading hospital network...</p>
          </div>
        </div>
      )}

      {/* Phase 1: Quick Look Hover */}
      {hoveredHospital && (
        <div 
          className="fixed z-[1000] pointer-events-none bg-white/90 backdrop-blur-md border border-red-200 rounded-xl p-3 shadow-2xl animate-in fade-in zoom-in duration-200"
          style={{ left: mousePos.x + 15, top: mousePos.y - 15 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <h5 className="text-[11px] font-bold text-[#1a3d35] uppercase tracking-tight">{hoveredHospital.name}</h5>
          </div>
          <p className="text-[9px] text-[#4a7a6e] font-mono">{hoveredHospital.type}</p>
        </div>
      )}

      <MapContainer
        center={[TAGBILARAN_CENTER.lat, TAGBILARAN_CENTER.lng]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {hospitals.map((h) => (
          <Marker 
            key={`${h.id}-${h.name}`} 
            position={[h.lat, h.lng]} 
            icon={HospitalIcon(h.type)}
            eventHandlers={{
              mouseover: (e) => handleMouseEnter(h, e),
              mouseout: handleMouseLeave,
              click: () => {
                handleMouseLeave();
              }
            }}
          >
            <Popup className="custom-popup" minWidth={200}>
              <div className="p-1 text-[#1a3d35]">
                <h4 className="font-sans font-bold text-sm mb-0.5 text-red-500">{h.name}</h4>
                <p className="text-[9px] text-[#4a7a6e] uppercase tracking-widest mb-2 font-bold">
                  {h.type}
                </p>

                <div className="flex items-center justify-between mb-3 bg-red-50/50 p-2 rounded-lg border border-red-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase text-[#4a7a6e]">Distance</span>
                    <span className="text-[10px] font-bold text-red-600">{h.distance || "N/A"}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-red-100" />
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] uppercase text-[#4a7a6e]">Status</span>
                    <span className="text-[10px] font-bold text-green-600">{h.status || "Open"}</span>
                  </div>
                </div>

                <button
                  onClick={() => onShowDetail(h)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-[10px] font-bold text-white transition-all hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-95"
                >
                  View More Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <>
            <Marker position={userLocation} icon={UserLocationIcon}>
              <Popup>
                <div className="text-xs font-medium">Your current location (Barangay Cogon)</div>
              </Popup>
            </Marker>
            <Circle 
              center={userLocation}
              radius={5000}
              pathOptions={{
                fillColor: '#1f4f45',
                fillOpacity: 0.05,
                color: '#1f4f45',
                weight: 1,
                dashArray: '5, 10'
              }}
            />
          </>
        )}

        {/* Dynamic Zoom Handler */}
        {selectedHospital ? (
          <ChangeView lat={selectedHospital.lat} lng={selectedHospital.lng} zoom={16} />
        ) : (
          <ChangeView lat={TAGBILARAN_CENTER.lat} lng={TAGBILARAN_CENTER.lng} zoom={14} />
        )}
      </MapContainer>
    </div>
  );
}

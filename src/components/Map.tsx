import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from "react-leaflet";
// ... (lines 3-71)
function ChangeView({ lat, lng, zoom }: { lat: number, lng: number, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

// Click listener to close detail panel
function MapEvents({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click: (e) => {
      // Only trigger if clicking the map itself, not a marker/popup
      // Leaflet handles this naturally by not bubbling clicks from popups/markers to the map if preferred,
      // but we'll call it to clear selection.
      onClick();
    },
  });
  return null;
}

// Doctor list popup sub-component
// ...
interface HospitalMapProps {
  hospitals: HospitalCard[];
  isLoading: boolean;
  onShowDetail: (hospital: HospitalCard) => void;
  onCloseDetail: () => void;
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
        
        <MapEvents onClick={onCloseDetail} />

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

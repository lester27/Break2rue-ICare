import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HospitalCard, DoctorRecord } from "@/types";
import { X, Navigation, Users, Clock, Phone, MapPin, Activity, Stethoscope, Loader2, ChevronUp } from "lucide-react";
import { fetchDoctorsForHospital } from "@/services/apiService";
import { cn } from "@/lib/utils";

interface HospitalDetailPanelProps {
  hospital: HospitalCard | null;
  onClose: () => void;
  suggestedSpecialty: string | null;
}

export default function HospitalDetailPanel({ hospital, onClose, suggestedSpecialty }: HospitalDetailPanelProps) {
  const [showDoctors, setShowDoctors] = useState(false);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const handleToggleDoctors = async () => {
    if (!showDoctors && hospital) {
      setLoadingDoctors(true);
      const data = await fetchDoctorsForHospital(hospital.id);
      
      // Sort doctors if there's a suggested specialty
      if (suggestedSpecialty) {
        const sorted = [...data].sort((a, b) => {
          const aMatch = a.department?.toLowerCase().includes(suggestedSpecialty.toLowerCase()) || 
                         a.type?.toLowerCase().includes(suggestedSpecialty.toLowerCase());
          const bMatch = b.department?.toLowerCase().includes(suggestedSpecialty.toLowerCase()) || 
                         b.type?.toLowerCase().includes(suggestedSpecialty.toLowerCase());
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
        setDoctors(sorted);
      } else {
        setDoctors(data);
      }
      
      setLoadingDoctors(false);
    }
    setShowDoctors(!showDoctors);
  };

  if (!hospital) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 150) onClose();
        }}
        className="fixed inset-x-0 bottom-0 z-[1001] mx-auto max-w-2xl px-4 pb-4 pointer-events-none"
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-t-[32px] rounded-b-[24px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-x border-t border-red-100 pointer-events-auto overflow-hidden">
          {/* Drag Handle */}
          <div className="w-full flex flex-col items-center py-3 group cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full group-hover:bg-red-200 transition-colors" />
          </div>

          <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {hospital.type}
                  </span>
                  <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {hospital.status || "Open"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#1a3d35] leading-tight">{hospital.name}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#f0f9f6] p-4 rounded-2xl border border-[#8fd1bd]/20">
                <div className="text-red-500 mb-1"><MapPin className="h-4 w-4" /></div>
                <div className="text-[10px] text-[#4a7a6e] uppercase font-bold tracking-wider">Distance</div>
                <div className="text-sm font-bold text-[#1a3d35]">{hospital.distance || "N/A"}</div>
              </div>
              <div className="bg-[#f0f9f6] p-4 rounded-2xl border border-[#8fd1bd]/20">
                <div className="text-red-500 mb-1"><Clock className="h-4 w-4" /></div>
                <div className="text-[10px] text-[#4a7a6e] uppercase font-bold tracking-wider">Travel Time</div>
                <div className="text-sm font-bold text-[#1a3d35]">{hospital.travel || "Calculated"}</div>
              </div>
              <div className="bg-[#f0f9f6] p-4 rounded-2xl border border-[#8fd1bd]/20">
                <div className="text-red-500 mb-1"><Activity className="h-4 w-4" /></div>
                <div className="text-[10px] text-[#4a7a6e] uppercase font-bold tracking-wider">Services</div>
                <div className="text-sm font-bold text-[#1a3d35]">{hospital.specializations.length} Major</div>
              </div>
            </div>

            {/* Specialties */}
            <div className="mb-8">
              <h4 className="text-[11px] font-bold text-[#4a7a6e] uppercase tracking-[0.2em] mb-3">Medical Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {hospital.specializations.map((spec, i) => (
                  <span key={i} className="bg-white border border-[#8fd1bd]/30 px-3 py-1.5 rounded-xl text-[11px] font-medium text-[#1a3d35] shadow-sm">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Doctors Section */}
            {showDoctors && (
              <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-[11px] font-bold text-[#4a7a6e] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-red-400" /> 
                  Available Specialists
                </h4>
                {loadingDoctors ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 text-red-400 animate-spin mb-2" />
                    <p className="text-[11px] text-[#4a7a6e]">Connecting to medical database...</p>
                  </div>
                ) : doctors.length > 0 ? (
                    <div className="space-y-3">
                      {doctors.map((doc) => {
                        const isMatch = suggestedSpecialty && (
                          doc.department?.toLowerCase().includes(suggestedSpecialty.toLowerCase()) || 
                          doc.type?.toLowerCase().includes(suggestedSpecialty.toLowerCase())
                        );
                        
                        return (
                          <div 
                            key={doc.id} 
                            className={cn(
                              "bg-white border p-4 rounded-2xl shadow-sm flex justify-between items-center group transition-all",
                              isMatch ? "border-amber-200 bg-amber-50/30" : "border-gray-100 hover:border-red-200"
                            )}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "font-bold text-sm transition-colors",
                                  isMatch ? "text-amber-700" : "text-[#1a3d35] group-hover:text-red-600"
                                )}>
                                  {doc.name}
                                </p>
                                {isMatch && (
                                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                                    <Activity className="h-2 w-2" /> Most Suitable
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#4a7a6e] font-medium">{doc.department || doc.type}</p>
                              {doc.schedule && <p className="text-[10px] text-[#4a7a6e] mt-1 flex items-center gap-1 opacity-70"><Clock className="h-3 w-3" /> {doc.schedule}</p>}
                            </div>
                            <div className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight",
                              isMatch ? "bg-amber-100 text-amber-700" : "bg-[#f0f9f6] text-[#1f4f45]"
                            )}>
                              Consultation
                            </div>
                          </div>
                        );
                      })}
                    </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[11px] text-[#4a7a6e] italic">No online doctor records found for this facility</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
            <button
              onClick={handleToggleDoctors}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 py-3.5 rounded-2xl text-[12px] font-bold text-[#1a3d35] hover:bg-gray-100 transition-all shadow-sm active:scale-[0.98]"
            >
              <Users className="h-4 w-4 text-red-500" />
              {showDoctors ? "Hide Doctors" : "View Doctors"}
            </button>
            <button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
                window.open(url, "_blank");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 py-3.5 rounded-2xl text-[12px] font-bold text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState } from "react";
import HospitalMap from "./Map";
import HospitalDetailPanel from "./HospitalDetailPanel";
import { UserProfile, HospitalCard } from "@/types";
import { LogOut, Home, History, User as UserIcon, Activity, Droplet, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  profile: UserProfile;
  onLogout: () => void;
  hospitals: HospitalCard[];
  isLoadingHospitals: boolean;
  backendConnected: boolean;
  viewMode: 'nearby' | 'all';
  setViewMode: (mode: 'nearby' | 'all') => void;
  selectedHospital: HospitalCard | null;
  setSelectedHospital: (h: HospitalCard | null) => void;
  suggestedSpecialty: string | null;
}

export default function Dashboard({ 
  profile, 
  onLogout, 
  hospitals, 
  isLoadingHospitals, 
  backendConnected,
  viewMode,
  setViewMode,
  selectedHospital,
  setSelectedHospital,
  suggestedSpecialty
}: DashboardProps) {
  const bmi = profile.height && profile.weight 
    ? (Number(profile.weight) / Math.pow(Number(profile.height)/100, 2))
    : 0;

  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: "Underweight", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (val < 25) return { label: "Normal", color: "text-[#1f4f45] bg-[#8fd1bd]/20 border-[#8fd1bd]/30" };
    if (val < 30) return { label: "Overweight", color: "text-orange-600 bg-orange-50 border-orange-200" };
    return { label: "Obese", color: "text-red-600 bg-red-50 border-red-200" };
  };

  const bmiStyle = getBMICategory(bmi);

  return (
    <div className="flex h-screen w-full bg-[#f0f9f6] text-[#1a3d35] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 h-full flex flex-col bg-white border-r border-[#8fd1bd]/20 z-20 shadow-2xl">
        {/* Brand */}
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-[#1f4f45] rounded-xl flex items-center justify-center text-white">
              <Activity className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase font-sans">Icare</h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#4a7a6e]">Health Companion</p>
        </div>

        {/* User Card */}
        <div className="px-6 mb-8">
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#1f4f45] to-[#2d6b5c] text-white shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium text-sm leading-none mb-1">{profile.name}</h4>
                <p className="text-[10px] text-white/60">Verified Citizen</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">BMI</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", bmiStyle.color)}>
                  {bmi.toFixed(1)} — {bmiStyle.label}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Blood Type</span>
                <span className="flex items-center gap-1 font-bold">
                  <Droplet className="h-3 w-3 text-[#fb7185]" fill="#fb7185" />
                  {profile.bloodType || "N/A"}
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10 my-4" />

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-white/50">Conditions</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.conditions.length > 0 ? (
                    profile.conditions.map(c => (
                      <span key={c} className="text-[9px] bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-white/30 italic whitespace-nowrap">No history registered</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1f4f45]/5 text-[#1f4f45] font-semibold cursor-pointer">
            <Home className="h-5 w-5" />
            <span className="text-sm">Nearby Hospitals</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl text-[#4a7a6e] hover:bg-[#1f4f45]/5 transition-colors cursor-pointer group">
            <History className="h-5 w-5 group-hover:text-[#1f4f45]" />
            <span className="text-sm group-hover:text-[#1f4f45]">Health Records</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl text-[#4a7a6e] hover:bg-[#1f4f45]/5 transition-colors cursor-pointer group">
            <UserIcon className="h-5 w-5 group-hover:text-[#1f4f45]" />
            <span className="text-sm group-hover:text-[#1f4f45]">Account Settings</span>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-6">
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative z-0">
        <HospitalMap 
          hospitals={hospitals} 
          isLoading={isLoadingHospitals} 
          onShowDetail={(h) => setSelectedHospital(h)}
          selectedHospital={selectedHospital}
        />
        
        {/* Overlays */}
        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xl border border-[#8fd1bd]/30 rounded-2xl p-4 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-3 w-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                backendConnected ? "bg-green-500" : "bg-amber-500 animate-pulse"
              )} />
              <span className="text-xs font-bold text-[#1f4f45] tracking-tight uppercase font-mono">
                {backendConnected ? "Live Hospital Network" : "Mock Data Mode"}
              </span>
            </div>
            <p className="text-[10px] text-[#4a7a6e] mt-1">
              {isLoadingHospitals
                ? "Loading facilities..."
                : `Found ${hospitals.length} facilities in Tagbilaran`}
            </p>
            {/* Backend connection indicator */}
            <div className="flex items-center gap-1.5 mt-2">
              {backendConnected ? (
                <Wifi className="h-3 w-3 text-green-600" />
              ) : (
                <WifiOff className="h-3 w-3 text-amber-600" />
              )}
              <span className="text-[9px] font-mono text-[#4a7a6e]">
                {backendConnected ? "Database connected" : "Using fallback data"}
              </span>
            </div>

            {/* Toggle Button */}
            <div className="mt-4 pt-3 border-t border-[#8fd1bd]/20">
              <div className="flex p-1 bg-[#1f4f45]/5 rounded-xl gap-1">
                <button
                  onClick={() => setViewMode('nearby')}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5",
                    viewMode === 'nearby' 
                      ? "bg-[#1f4f45] text-white shadow-lg translate-y-[-1px]" 
                      : "text-[#4a7a6e] hover:bg-[#1f4f45]/10"
                  )}
                >
                  <Activity className={cn("h-3 w-3", viewMode === 'nearby' ? "text-[#8fd1bd]" : "text-[#4a7a6e]")} />
                  Nearby
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5",
                    viewMode === 'all' 
                      ? "bg-[#1f4f45] text-white shadow-lg translate-y-[-1px]" 
                      : "text-[#4a7a6e] hover:bg-[#1f4f45]/10"
                  )}
                >
                  <Home className={cn("h-3 w-3", viewMode === 'all' ? "text-[#8fd1bd]" : "text-[#4a7a6e]")} />
                  All
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Phase 3: Slide-up Detail Panel */}
      <HospitalDetailPanel 
        hospital={selectedHospital} 
        onClose={() => setSelectedHospital(null)} 
        suggestedSpecialty={suggestedSpecialty}
      />
    </div>
  );
}

import React, { useState } from "react";
import { User, Activity, AlertTriangle, ShieldCheck, ArrowRight, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types";

interface HealthProfileFormProps {
  onComplete: (profile: UserProfile) => void;
}

export default function HealthProfileForm({ onComplete }: HealthProfileFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    bloodType: "",
    conditions: [],
    allergies: "",
    medications: ""
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const toggleCondition = (cond: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter(c => c !== cond)
        : [...prev.conditions, cond]
    }));
  };

  const isFormValid = () => {
    if (step === 1 && (!formData.name || !formData.age || !formData.sex)) return false;
    if (step === 2 && (!formData.height || !formData.weight)) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4ede7] via-[#eaf6f2] to-[#c8e8df] flex items-center justify-center p-6 bg-fixed">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#8fd1bd]/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#1f4f45]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-12 w-12 bg-[#1f4f45] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <HeartPulse className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1a3d35]">Establish Your iCare+ Profile</h1>
            <p className="text-sm text-[#4a7a6e]">Your data helps Nurse Hofi provide personalized guidance.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl overflow-hidden">
          {/* Progress */}
          <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] uppercase tracking-widest font-mono text-[#4a7a6e]">Step {step} of 4</span>
              <span className="text-[10px] font-bold text-[#1f4f45]">{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#8fd1bd] to-[#1f4f45] transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-8 animate-in fade-in scale-in-95 duration-300">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5 text-[#1f4f45]" />
                  <h3 className="font-medium text-[#1a3d35]">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Full Name</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Juan dela Cruz"
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Age</label>
                      <input 
                        type="number"
                        value={formData.age}
                        onChange={e => setFormData({...formData, age: e.target.value})}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Sex</label>
                      <select 
                        value={formData.sex}
                        onChange={e => setFormData({...formData, sex: e.target.value})}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-5 w-5 text-[#1f4f45]" />
                  <h3 className="font-medium text-[#1a3d35]">Physical Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Height (cm)</label>
                    <input 
                      type="number"
                      value={formData.height}
                      onChange={e => setFormData({...formData, height: e.target.value})}
                      placeholder="170"
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Weight (kg)</label>
                    <input 
                      type="number"
                      value={formData.weight}
                      onChange={e => setFormData({...formData, weight: e.target.value})}
                      placeholder="65"
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all"
                    />
                  </div>
                </div>
                <div className="p-4 bg-[#1f4f45]/5 rounded-2xl border border-[#1f4f45]/10 flex items-center justify-between">
                  <div className="text-xs text-[#4a7a6e]">Estimated BMI</div>
                  <div className="text-lg font-bold text-[#1f4f45]">
                    {formData.height && formData.weight 
                      ? (Number(formData.weight) / Math.pow(Number(formData.height)/100, 2)).toFixed(1)
                      : "—"}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-[#1f4f45]" />
                  <h3 className="font-medium text-[#1a3d35]">Medical History</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Kidney Disease", "Thyroid"].map(cond => (
                    <button
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={cn(
                        "text-sm p-4 rounded-2xl border transition-all text-left",
                        formData.conditions.includes(cond)
                          ? "bg-[#1f4f45] text-white border-transparent shadow-lg"
                          : "bg-white/80 border-[#8fd1bd]/30 text-[#4a7a6e] hover:border-[#1f4f45]/50"
                      )}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-5 w-5 text-[#1f4f45]" />
                  <h3 className="font-medium text-[#1a3d35]">Allergies & Meds</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Allergies</label>
                    <textarea 
                      value={formData.allergies}
                      onChange={e => setFormData({...formData, allergies: e.target.value})}
                      placeholder="e.g., Penicillin, Peanuts"
                      className="w-full px-5 py-4 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all h-24 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Current Medications</label>
                    <textarea 
                      value={formData.medications}
                      onChange={e => setFormData({...formData, medications: e.target.value})}
                      placeholder="e.g., Metformin (500mg)"
                      className="w-full px-5 py-4 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 flex gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="flex-1 px-6 py-4 rounded-2xl bg-white/40 border border-[#8fd1bd]/30 text-[#1f4f45] font-semibold hover:bg-white/60 transition-all active:scale-95"
              >
                Back
              </button>
            )}
            <button 
              onClick={() => step < 4 ? nextStep() : onComplete(formData)}
              disabled={!isFormValid()}
              className="flex-[2] px-6 py-4 rounded-2xl bg-[#1f4f45] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#2a665d] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {step === 4 ? "Complete Setup" : "Continue"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#4a7a6e]/50 font-medium">
          © 2026 iCare+ Tagbilaran • Privacy Optimized Prototype
        </p>
      </div>
    </div>
  );
}

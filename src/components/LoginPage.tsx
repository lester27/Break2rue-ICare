import React, { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4ede7] via-[#eaf6f2] to-[#c8e8df] flex items-center justify-center p-6 bg-fixed">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8fd1bd]/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#1f4f45]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto h-16 w-16 bg-[#1f4f45] rounded-3xl flex items-center justify-center text-white shadow-xl mb-6">
            <Activity className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1a3d35] font-sans uppercase">iCare<span className="text-[#8fd1bd]">+</span></h1>
          <p className="text-[#4a7a6e] font-sans tracking-[0.2em] text-[10px] uppercase mt-2">Tagbilaran Health Literacy Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white/20 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-150">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a3d35] mb-2">Welcome back</h2>
            <p className="text-sm text-[#4a7a6e]">Sign in to access your health companion.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a7a6e]/50 group-focus-within:text-[#1f4f45] transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@email.com"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all placeholder-[#8ab5ae]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#4a7a6e] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a7a6e]/50 group-focus-within:text-[#1f4f45] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/80 border border-[#8fd1bd]/30 focus:outline-none focus:ring-2 focus:ring-[#1f4f45] transition-all placeholder-[#8ab5ae]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a7a6e]/50 hover:text-[#1f4f45] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-[#1f4f45] text-white font-semibold flex items-center justify-center gap-3 hover:bg-[#2a665d] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-8"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#8fd1bd]/30 text-center">
            <p className="text-sm text-[#4a7a6e]">
              Don't have an account?{" "}
              <button className="text-[#1f4f45] font-bold hover:underline">Create one</button>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#4a7a6e]/50 font-medium">
          © 2026 iCare+ Tagbilaran • Private & Secure
        </p>
      </div>
    </div>
  );
}

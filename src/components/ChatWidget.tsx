import React, { useState, useEffect, useRef } from "react";
import { Send, User, X, Minimize2, Maximize2, MessageSquare, AlertCircle, Building2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChatMessage, sendChatMessage } from "@/services/geminiService";
import { sendOfflineChatMessage } from "@/services/apiService";
import { UserProfile, HospitalCard } from "@/types";

interface ChatWidgetProps {
  userProfile?: UserProfile;
  backendConnected?: boolean;
  hospitals: HospitalCard[];
  onSelectHospital: (hospital: HospitalCard) => void;
  onSuggestSpecialty: (specialty: string | null) => void;
}

export default function ChatWidget({ 
  userProfile, 
  backendConnected, 
  hospitals, 
  onSelectHospital,
  onSuggestSpecialty 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      parts: [{ text: "Hello! I'm HoFi, your personal digital nurse here at iCare+. 🌿 I'm here to help you feel better and find the right care in Tagbilaran. What can I do for you today?" }],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const [isOffline, setIsOffline] = useState(false);

  const handleOfflineTriage = async (input: string) => {
    const userMsg: ChatMessage = { role: "user", parts: [{ text: input }] };
    setHistory((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (backendConnected) {
      try {
        const result = await sendOfflineChatMessage(input);
        if (result) {
          let reply = result.reply;
          if (result.found && result.hospitals?.length > 0) {
            const hospitalNames = result.hospitals
              .slice(0, 3)
              .map((h) => `[HOSPITAL:${h.id}:${h.name}]`)
              .join("\n");
            reply += `\n\nRecommended facilities:\n${hospitalNames}`;
          }
          setHistory((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
          setIsLoading(false);
          return;
        }
      } catch { }
    }

    let reply = "I understand. These are the suited hospitals for that section in Tagbilaran, Bohol. Please proceed to the ER if this is an emergency.";
    
    const text = input.toLowerCase();
    if (text.includes("chest pain")) {
      reply = "ESI-1: Chest pain needs immediate attention. Please proceed to GCGMC or Holy Name ER.";
    } else if (text.includes("fever")) {
      reply = "ESI-4: For fever, you may visit Tagbilaran Community Hospital or any general clinic.";
    }
    
    setTimeout(() => {
      setHistory((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
      setIsLoading(false);
    }, 600);
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    if (isOffline) {
      handleOfflineTriage(message);
      setMessage("");
      return;
    }

    const userMsg: ChatMessage = { role: "user", parts: [{ text: message }] };
    setHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(message, history, userProfile, hospitals);
      
      // Check for specialty suggestion
      const specialtyMatch = data.text.match(/\[SPECIALTY:(.*?)\]/);
      if (specialtyMatch) {
        onSuggestSpecialty(specialtyMatch[1]);
      } else {
        // Reset if no specialty mentioned in this specific reply? 
        // Or keep previous? User said "if it is warranted". 
        // I'll keep it for the session until a new one replaces it.
      }

      const botMsg: ChatMessage = { role: "model", parts: [{ text: data.text }] };
      setHistory((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      let errorText = `I'm sorry, I'm having trouble connecting: ${error.message || "Unknown Error"}`;
      if (error.message === "API_KEY_MISSING") {
        errorText = "Hofi needs a Gemini API Key to operate. Please check your .env file.";
      }
      const errMsg: ChatMessage = { role: "model", parts: [{ text: errorText }] };
      setHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render message content with clickable hospital chips
  const renderMessageContent = (text: string) => {
    // Hide specialty tags from the UI
    const filteredText = text.replace(/\[SPECIALTY:.*?\]/g, "");
    
    // Regex to find [HOSPITAL:ID:NAME]
    const parts = filteredText.split(/(\[HOSPITAL:\d+:.*?\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[HOSPITAL:(\d+):(.*?)\]/);
      if (match) {
        const id = parseInt(match[1]);
        const name = match[2];
        const hospital = hospitals.find(h => h.id === id);
        
        return (
          <button
            key={index}
            onClick={() => hospital && onSelectHospital(hospital)}
            className="my-2 flex w-full items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3 text-left transition-all hover:bg-red-50 hover:border-red-200 group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500 p-2 text-white shadow-sm group-hover:scale-110 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Facility</p>
                <p className="text-[13px] font-bold text-[#1a3d35]">{name}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </button>
        );
      }
      
      // Strip leading bullet points, conjunctions (e.g. "or ", "and "), and whitespace
      const cleanPart = part
        .replace(/^[\s•-]+\s/gm, "")
        .replace(/^\* /gm, "")
        .replace(/^(or|nor|and|try|try this:)\s+/gim, "")
        .trim();
      
      if (!cleanPart && !match) return null; // Skip empty text parts
      
      const textParts = cleanPart.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {textParts.map((t, i) => {
            if (t.startsWith("**") && t.endsWith("**")) {
              return <strong key={i} className="font-bold text-[#1a3d35]">{t.slice(2, -2)}</strong>;
            }
            return t;
          })}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 flex h-[650px] w-96 flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white/80 shadow-2xl backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="flex bg-[#1f4f45] p-5 items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-medium leading-tight">HoFi</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-green-100">AI Assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border transition-all",
                    isOffline 
                      ? "bg-amber-100 text-amber-700 border-amber-200" 
                      : "bg-white/10 text-white/60 border-white/10 hover:text-white hover:bg-white/20"
                  )}
                >
                  <AlertCircle className="h-2.5 w-2.5" />
                  {isOffline ? "Offline" : "Online"}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide custom-scrollbar">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[90%]",
                    msg.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm whitespace-pre-line",
                      msg.role === "user"
                        ? "bg-[#1f4f45] text-white rounded-br-none"
                        : "bg-white text-[#1a3d35] border border-gray-100 rounded-bl-none"
                    )}
                  >
                    {msg.role === "user" ? msg.parts[0].text : renderMessageContent(msg.parts[0].text)}
                  </div>
                  <span className="mt-1 text-[10px] text-[#4a7a6e]/60 font-mono">
                    {msg.role === "user" ? "You" : "HoFi"}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start max-w-[85%]">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8fd1bd] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/50 border-t border-white/10">
              <div className="relative flex items-center">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your symptoms..."
                  className="w-full resize-none rounded-2xl border-none bg-white py-3 pl-4 pr-12 text-[13px] text-[#1a3d35] placeholder-[#8ab5ae] ring-1 ring-gray-100 focus:ring-2 focus:ring-[#1f4f45] focus:outline-none transition-all shadow-sm"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !message.trim()}
                  className="absolute right-2 rounded-xl bg-[#1f4f45] p-2.5 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] text-[#4a7a6e]/50 font-sans">
                HoFi provides health guidance, not medical diagnosis.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Bubble */}
      <button
        onClick={() => {
          if (isOpen && isMinimized) setIsMinimized(false);
          else if (!isOpen) setIsOpen(true);
        }}
        className={cn(
          "pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1f4f45] text-white shadow-xl transition-all hover:scale-110 active:scale-95",
          isOpen && !isMinimized && "hidden"
        )}
      >
        <MessageSquare className="h-8 w-8" />
        {(isOpen && isMinimized) || !isOpen ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8fd1bd] text-[#1f4f45] text-[10px] font-bold"
          >
            !
          </motion.div>
        ) : null}
      </button>
    </div>
  );
}

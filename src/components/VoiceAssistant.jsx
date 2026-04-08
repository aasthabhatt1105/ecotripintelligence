import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, X, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAVIGATION_MAP = {
  home: "/", dashboard: "/",
  track: "/track", tracking: "/track", "live tracking": "/track",
  planner: "/planner", "ai planner": "/planner", plan: "/planner",
  profile: "/profile",
};

function speak(text) {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef(null);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setPulse(false);
  };

  const startListening = () => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setListening(true); setPulse(true); setTranscript(""); setResponse(""); };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      handleCommand(text);
    };
    rec.onerror = () => { setListening(false); setPulse(false); };
    rec.onend = () => { setListening(false); setPulse(false); };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleCommand = async (text) => {
    setLoading(true);

    // Check navigation intent first
    const lower = text.toLowerCase();
    for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
      if (lower.includes(`go to ${keyword}`) || lower.includes(`open ${keyword}`) || lower.includes(`navigate to ${keyword}`) || lower === keyword) {
        const msg = `Navigating to ${keyword}.`;
        setResponse(msg);
        speak(msg);
        setLoading(false);
        setTimeout(() => { navigate(path); setOpen(false); }, 800);
        return;
      }
    }

    // Otherwise use LLM for eco Q&A
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are EcoTrip's friendly voice assistant — like Siri but for eco-friendly travel. 
Answer concisely in 1-2 short sentences (spoken aloud). Be helpful, friendly, and eco-focused.
User said: "${text}"`,
    });

    const answer = typeof result === "string" ? result : result?.response || "I'm not sure about that.";
    setResponse(answer);
    speak(answer);
    setLoading(false);
  };

  const handleToggle = () => {
    if (open) {
      stopListening();
      window.speechSynthesis.cancel();
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
          open ? "bg-destructive text-white" : "bg-primary text-white"
        }`}
      >
        {open ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-card border border-border/60 rounded-3xl shadow-2xl p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">EcoTrip Assistant</p>
                <p className="text-[10px] text-muted-foreground">Ask anything or say "Go to Planner"</p>
              </div>
            </div>

            {/* Waveform / status */}
            <div className="flex flex-col items-center gap-2 py-2">
              {listening ? (
                <div className="flex items-end gap-1 h-8">
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-primary rounded-full"
                      animate={{ height: [8, 20 + Math.random() * 12, 8] }}
                      transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {loading ? "Thinking..." : transcript ? "" : "Tap the mic to speak"}
                </p>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-muted/40 rounded-2xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">You said:</p>
                <p className="text-sm font-medium">{transcript}</p>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className="bg-primary/5 rounded-2xl px-3 py-2">
                <p className="text-[10px] text-primary font-semibold mb-0.5">EcoTrip:</p>
                <p className="text-sm text-foreground">{response}</p>
              </div>
            )}

            {/* Mic button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={listening ? stopListening : startListening}
              disabled={!supported || loading}
              className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
                listening
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "bg-primary text-white"
              } disabled:opacity-50`}
            >
              {listening ? (
                <><MicOff className="w-4 h-4" /> Stop</>
              ) : (
                <><Mic className="w-4 h-4" /> {loading ? "Processing..." : "Speak"}</>
              )}
            </motion.button>

            {!supported && (
              <p className="text-[10px] text-destructive text-center">Voice not supported in this browser.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
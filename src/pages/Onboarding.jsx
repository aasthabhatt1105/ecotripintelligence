import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Leaf, Footprints, Bike, Bus, TrainFront, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

const TRANSPORT_OPTIONS = [
  { key: "walking", icon: Footprints, label: "Walking", desc: "0 g CO₂/km" },
  { key: "cycling", icon: Bike, label: "Cycling", desc: "0 g CO₂/km" },
  { key: "electric_bus", icon: Bus, label: "Electric Bus", desc: "20 g CO₂/km" },
  { key: "train", icon: TrainFront, label: "Train", desc: "30 g CO₂/km" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [preferredTransport, setPreferredTransport] = useState("walking");
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      bio,
      preferred_transport: preferredTransport,
      onboarded: true,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <span className="text-2xl font-bold">EcoTrip</span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? "w-8 bg-primary" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome to EcoTrip! 🌱</h1>
              <p className="text-muted-foreground mt-2">
                Track your eco-friendly journeys, save CO₂, and earn rewards. Let's set up your profile.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">What motivates your eco travel? <span className="text-muted-foreground">(optional)</span></label>
              <Textarea
                placeholder="e.g. I want to reduce my carbon footprint and explore sustainably..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="rounded-2xl resize-none"
                rows={3}
              />
            </div>
            <Button onClick={() => setStep(2)} className="w-full h-12 rounded-2xl">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">How do you travel? 🚲</h1>
              <p className="text-muted-foreground mt-2">
                Choose your preferred eco-friendly transport mode. You can always change it when tracking.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TRANSPORT_OPTIONS.map(({ key, icon: Icon, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setPreferredTransport(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    preferredTransport === key
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${preferredTransport === key ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${preferredTransport === key ? "text-primary" : "text-foreground"}`}>{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
            <Button onClick={handleFinish} disabled={saving} className="w-full h-12 rounded-2xl">
              {saving ? "Setting up..." : "Get Started 🌍"}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
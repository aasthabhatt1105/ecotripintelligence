import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Leaf, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import SatelliteDataBadge from "../components/SatelliteDataBadge";
import ItineraryCard from "../components/ItineraryCard";
import { generateSatelliteData, generateWeatherForecast } from "../lib/ecoUtils";

const QUICK_DESTINATIONS = [
  { label: "🇨🇷 Costa Rica", value: "Costa Rica" },
  { label: "🇳🇱 Netherlands", value: "Netherlands" },
  { label: "🇯🇵 Japan", value: "Japan" },
  { label: "🏝️ Bali", value: "Bali, Indonesia" },
];

export default function AIPlanner() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I'm your AI Eco Travel Planner 🌿\n\nTell me where you'd like to go, and I'll create a sustainable itinerary with satellite data insights!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const generateItinerary = async (destination) => {
    setMessages((prev) => [...prev, { role: "user", content: destination }]);
    setInput("");
    setLoading(true);

    const satData = generateSatelliteData(
      10 + Math.random() * 40,
      -10 + Math.random() * 140
    );
    const weather = generateWeatherForecast(destination);

    const prompt = `You are an eco-travel AI planner. Generate a 5-day sustainable travel itinerary for ${destination}.

Return a JSON object with this exact structure:
{
  "destination_summary": "Brief eco-friendly description of the destination",
  "eco_score": "A or A+ or B",
  "total_carbon_budget_kg": number,
  "transport_options": [
    {"mode": "string", "carbon_per_km": number, "recommended": boolean, "description": "string"}
  ],
  "daily_schedule": [
    {
      "day": number,
      "title": "string",
      "activities": [
        {"time": "string", "activity": "string", "eco_tip": "string", "carbon_impact": "low/medium/high"}
      ]
    }
  ],
  "sustainability_features": ["string"],
  "packing_list": ["string"],
  "emergency_contacts": [{"name": "string", "number": "string"}]
}

Make it realistic, detailed, and focused on eco-friendly options. Include local eco-certified accommodations, green transport, and nature-based activities.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          destination_summary: { type: "string" },
          eco_score: { type: "string" },
          total_carbon_budget_kg: { type: "number" },
          transport_options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mode: { type: "string" },
                carbon_per_km: { type: "number" },
                recommended: { type: "boolean" },
                description: { type: "string" },
              },
            },
          },
          daily_schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                title: { type: "string" },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string" },
                      activity: { type: "string" },
                      eco_tip: { type: "string" },
                      carbon_impact: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          sustainability_features: { type: "array", items: { type: "string" } },
          packing_list: { type: "array", items: { type: "string" } },
          emergency_contacts: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, number: { type: "string" } },
            },
          },
        },
      },
    });

    // Save itinerary
    await base44.entities.Itinerary.create({
      destination,
      duration_days: 5,
      plan_json: JSON.stringify(result),
      satellite_data_json: JSON.stringify(satData),
      total_carbon_budget_kg: result.total_carbon_budget_kg,
      eco_score: result.eco_score,
    });

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: `Here's your eco-friendly itinerary for **${destination}**! 🌍`,
        satelliteData: satData,
        weather,
        itinerary: result,
      },
    ]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    generateItinerary(input.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Eco Planner</h1>
            <p className="text-xs text-muted-foreground">Powered by satellite data</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg px-4 py-3"
                    : "space-y-2"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Leaf className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-card rounded-3xl rounded-bl-lg px-4 py-3 border border-border/50 shadow-sm">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                )}
                {msg.role === "user" && (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.satelliteData && (
                  <div className="ml-9">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Satellite Data
                    </div>
                    <SatelliteDataBadge data={msg.satelliteData} />
                  </div>
                )}
                {msg.itinerary && (
                  <div className="ml-9">
                    <ItineraryCard itinerary={msg.itinerary} weather={msg.weather} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            </div>
            <div className="bg-card rounded-2xl px-4 py-3 border border-border/50">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick destinations */}
        {messages.length === 1 && (
          <div className="ml-9 flex flex-wrap gap-2">
            {QUICK_DESTINATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => generateItinerary(d.value)}
                disabled={loading}
                className="bg-card border border-border/50 rounded-2xl px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm"
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-6 pt-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Where do you want to go?"
            className="rounded-2xl h-12 bg-card border-border/50"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-2xl h-12 w-12 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
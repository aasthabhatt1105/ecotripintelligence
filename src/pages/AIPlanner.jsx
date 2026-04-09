import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Leaf, Sparkles, Loader2, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import SatelliteDataBadge from "../components/SatelliteDataBadge";
import ItineraryCard from "../components/ItineraryCard";
import DayTripsCard from "../components/DayTripsCard";

const QUICK_DESTINATIONS = [
  { label: "🇨🇷 Costa Rica", value: "Costa Rica" },
  { label: "🇳🇱 Netherlands", value: "Netherlands" },
  { label: "🇯🇵 Japan", value: "Japan" },
  { label: "🏝️ Bali", value: "Bali, Indonesia" },
];

const DIETARY_OPTIONS = [
  { key: "vegan", label: "🌱 Vegan" },
  { key: "vegetarian", label: "🥗 Vegetarian" },
  { key: "gluten_free", label: "🌾 Gluten-Free" },
  { key: "halal", label: "☪️ Halal" },
  { key: "kosher", label: "✡️ Kosher" },
  { key: "nut_free", label: "🥜 Nut-Free" },
];

export default function AIPlanner() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I'm your AI Eco Travel Planner 🌿\n\nTell me where you'd like to go, and I'll create a sustainable itinerary with restaurant picks, packing list, and eco-friendly stays!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [dietaryPrefs, setDietaryPrefs] = useState([]);
  const [includePacking, setIncludePacking] = useState(true);
  const [includeAccommodations, setIncludeAccommodations] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleDietary = (key) => {
    setDietaryPrefs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const generateItinerary = async (destination) => {
    const dietaryStr = dietaryPrefs.length > 0
      ? `Dietary preferences/restrictions: ${dietaryPrefs.join(", ")}.`
      : "No dietary restrictions.";

    const userLabel = destination + (dietaryPrefs.length > 0 ? ` (${dietaryPrefs.join(", ")})` : "");
    setMessages((prev) => [...prev, { role: "user", content: userLabel }]);
    setInput("");
    setLoading(true);

    // Call 1: main itinerary (no internet search to keep response tight)
    const mainPrompt = `Eco-travel planner. Destination: "${destination}". ${dietaryStr}
Generate: 5-day sustainable itinerary, transport options, ${includePacking ? "packing list (essentials/clothing/eco_items)," : ""} ${includeAccommodations ? "3 eco accommodations," : ""} 3+ restaurants with dietary tags, satellite environmental data, 5-day forecast, sustainability features. Be concise.`;

    // Call 2: day trips
    const dayTripsPrompt = `For "${destination}", suggest 4 nearby day trip destinations (1-3h travel). For each: name, emoji, short description, distance, eco rating (A+/A/B), best time to visit, 2 transport options (mode, route info, duration, frequency, cost, CO2 kg), 5-item day itinerary (time + activity + eco tip).`;

    const [mainResult, dayTripsResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: mainPrompt,
        add_context_from_internet: false,
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
            restaurants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  cuisine: { type: "string" },
                  dietary_tags: { type: "array", items: { type: "string" } },
                  eco_credential: { type: "string" },
                  location: { type: "string" },
                  price_range: { type: "string" },
                },
              },
            },
            packing_list: {
              type: "object",
              properties: {
                essentials: { type: "array", items: { type: "string" } },
                clothing: { type: "array", items: { type: "string" } },
                eco_items: { type: "array", items: { type: "string" } },
              },
            },
            eco_accommodations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  eco_features: { type: "array", items: { type: "string" } },
                  location: { type: "string" },
                  price_range: { type: "string" },
                  nearby_poi: { type: "string" },
                },
              },
            },
            sustainability_features: { type: "array", items: { type: "string" } },
            satellite_data: {
              type: "object",
              properties: {
                ndvi: { type: "number" },
                airQualityIndex: { type: "number" },
                waterQuality: { type: "number" },
                landSurfaceTemp: { type: "number" },
              },
            },
            forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  temp: { type: "number" },
                  condition: { type: "string" },
                },
              },
            },
          },
        },
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: dayTripsPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            day_trips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  emoji: { type: "string" },
                  description: { type: "string" },
                  distance_from_base: { type: "string" },
                  eco_rating: { type: "string" },
                  best_time: { type: "string" },
                  transport_options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        mode: { type: "string" },
                        route_info: { type: "string" },
                        duration: { type: "string" },
                        frequency: { type: "string" },
                        cost: { type: "string" },
                        carbon_kg: { type: "number" },
                      },
                    },
                  },
                  day_itinerary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string" },
                        activity: { type: "string" },
                        eco_tip: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const combined = { ...mainResult, day_trips: dayTripsResult.day_trips };

    await base44.entities.Itinerary.create({
      destination,
      duration_days: 5,
      plan_json: JSON.stringify(combined),
      satellite_data_json: JSON.stringify(mainResult.satellite_data),
      total_carbon_budget_kg: mainResult.total_carbon_budget_kg,
      eco_score: mainResult.eco_score,
      preferences: dietaryPrefs.join(","),
    });

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: `Here's your personalised eco-friendly itinerary for **${destination}**! 🌍`,
        satelliteData: mainResult.satellite_data,
        weather: mainResult.forecast,
        itinerary: combined,
        dayTrips: dayTripsResult.day_trips,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI Eco Planner</h1>
              <p className="text-xs text-muted-foreground">Powered by satellite data</p>
            </div>
          </div>
          <button
            onClick={() => setShowPrefs((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              showPrefs || dietaryPrefs.length > 0
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-muted-foreground border-border/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Preferences
            {dietaryPrefs.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {dietaryPrefs.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showPrefs ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPrefs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-card border border-border/50 rounded-2xl p-4 space-y-4">
                {/* Dietary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🍽️ Dietary Preferences</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleDietary(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          dietaryPrefs.includes(key)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📋 Include in Plan</p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">🎒 Weather-based packing list</span>
                    <div
                      onClick={() => setIncludePacking((p) => !p)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${includePacking ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${includePacking ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">🏡 Eco-friendly accommodations</span>
                    <div
                      onClick={() => setIncludeAccommodations((p) => !p)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${includeAccommodations ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeAccommodations ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className={`max-w-[90%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg px-4 py-3" : "space-y-2"}`}>
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
                {msg.role === "user" && <p className="text-sm">{msg.content}</p>}
                {msg.satelliteData && (
                  <div className="ml-9">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Satellite Data
                    </div>
                    <SatelliteDataBadge data={msg.satelliteData} />
                  </div>
                )}
                {msg.itinerary && (
                  <div className="ml-9">
                    <ItineraryCard itinerary={msg.itinerary} weather={msg.weather} />
                    {msg.dayTrips?.length > 0 && (
                      <div className="mt-3">
                        <DayTripsCard dayTrips={msg.dayTrips} />
                      </div>
                    )}
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
          <Button type="submit" disabled={loading || !input.trim()} className="rounded-2xl h-12 w-12 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
import { useState } from "react";
import { ChevronDown, ChevronUp, Leaf, Sun, Cloud, CloudRain, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const weatherIcons = {
  Sunny: Sun,
  "Partly Cloudy": Cloud,
  Cloudy: Cloud,
  "Light Rain": CloudRain,
};

function CarbonBadge({ impact }) {
  const colors = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${colors[impact] || colors.low}`}>
      {impact}
    </span>
  );
}

export default function ItineraryCard({ itinerary, weather }) {
  const [expandedDay, setExpandedDay] = useState(null);

  if (!itinerary) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <p className="text-sm text-foreground">{itinerary.destination_summary}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-primary font-semibold">
            <Leaf className="w-3.5 h-3.5" /> Score: {itinerary.eco_score}
          </div>
          <div className="text-xs text-muted-foreground">
            Carbon budget: {itinerary.total_carbon_budget_kg}kg
          </div>
        </div>
      </div>

      {/* Weather */}
      {weather && weather.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weather.slice(0, 5).map((day, i) => {
            const WeatherIcon = weatherIcons[day.condition] || Sun;
            return (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-2.5 text-center min-w-[64px] shrink-0">
                <div className="text-[10px] text-muted-foreground">{day.day || `Day ${i + 1}`}</div>
                <WeatherIcon className="w-4 h-4 mx-auto my-1 text-accent" />
                <div className="text-xs font-bold">{day.temp}°C</div>
                <div className="text-[9px] text-muted-foreground">{day.condition}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transport */}
      {itinerary.transport_options && (
        <div className="bg-card rounded-2xl border border-border/50 p-3 shadow-sm">
          <div className="text-xs font-bold mb-2">🚌 Transport Options</div>
          <div className="space-y-1.5">
            {itinerary.transport_options.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {t.recommended && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  <span className={t.recommended ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {t.mode}
                  </span>
                </div>
                <span className="text-muted-foreground">{t.carbon_per_km} g/km</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Schedule */}
      {itinerary.daily_schedule?.map((day) => (
        <div key={day.day} className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {day.day}
              </div>
              <span className="text-sm font-semibold">{day.title}</span>
            </div>
            {expandedDay === day.day ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <AnimatePresence>
            {expandedDay === day.day && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2">
                  {day.activities?.map((act, i) => (
                    <div key={i} className="flex gap-3 py-1.5 border-t border-border/30">
                      <div className="text-[10px] text-muted-foreground w-12 shrink-0 pt-0.5">{act.time}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{act.activity}</span>
                          <CarbonBadge impact={act.carbon_impact} />
                        </div>
                        {act.eco_tip && (
                          <div className="text-[10px] text-primary mt-0.5">💡 {act.eco_tip}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Sustainability */}
      {itinerary.sustainability_features && (
        <div className="bg-primary/5 rounded-2xl p-3">
          <div className="text-xs font-bold mb-2">🌿 Sustainability Features</div>
          <div className="space-y-1">
            {itinerary.sustainability_features.map((f, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
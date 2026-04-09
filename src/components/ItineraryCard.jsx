import { useState } from "react";
import { ChevronDown, ChevronUp, Leaf, Sun, Cloud, CloudRain, MapPin, Backpack, Hotel, Utensils } from "lucide-react";
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

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-bold">{title}</span>
    </div>
  );
}

export default function ItineraryCard({ itinerary, weather }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const [showAccommodations, setShowAccommodations] = useState(false);

  if (!itinerary) return null;

  const hasRestaurants = itinerary.restaurants?.length > 0;
  const hasPacking = itinerary.packing_list && (
    itinerary.packing_list.essentials?.length > 0 ||
    itinerary.packing_list.clothing?.length > 0 ||
    itinerary.packing_list.eco_items?.length > 0
  );
  const hasAccommodations = itinerary.eco_accommodations?.length > 0;

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
      {weather?.length > 0 && (
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

      {/* Restaurants */}
      {hasRestaurants && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowRestaurants((p) => !p)}
            className="w-full flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">Restaurant Recommendations</span>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                {itinerary.restaurants.length}
              </span>
            </div>
            {showRestaurants ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showRestaurants && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {itinerary.restaurants.map((r, i) => (
                    <div key={i} className="border-t border-border/30 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold">{r.name}</div>
                          <div className="text-[10px] text-muted-foreground">{r.cuisine} · {r.location}</div>
                        </div>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full shrink-0">{r.price_range}</span>
                      </div>
                      {r.dietary_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.dietary_tags.map((tag, j) => (
                            <span key={j} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.eco_credential && (
                        <div className="text-[10px] text-emerald-600 mt-1">🌿 {r.eco_credential}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Packing List */}
      {hasPacking && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPacking((p) => !p)}
            className="w-full flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold">Packing List</span>
            </div>
            {showPacking ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showPacking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {[
                    { key: "essentials", label: "✈️ Essentials", items: itinerary.packing_list.essentials },
                    { key: "clothing", label: "👕 Clothing", items: itinerary.packing_list.clothing },
                    { key: "eco_items", label: "🌱 Eco Items", items: itinerary.packing_list.eco_items },
                  ].filter(s => s.items?.length > 0).map((section) => (
                    <div key={section.key} className="border-t border-border/30 pt-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{section.label}</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {section.items.map((item, i) => (
                          <div key={i} className="text-xs text-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5 shrink-0">·</span>{item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Eco Accommodations */}
      {hasAccommodations && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAccommodations((p) => !p)}
            className="w-full flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Eco-Friendly Stays</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                {itinerary.eco_accommodations.length}
              </span>
            </div>
            {showAccommodations ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showAccommodations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {itinerary.eco_accommodations.map((acc, i) => (
                    <div key={i} className="border-t border-border/30 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold">{acc.name}</div>
                          <div className="text-[10px] text-muted-foreground">{acc.type} · {acc.location}</div>
                        </div>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full shrink-0">{acc.price_range}</span>
                      </div>
                      {acc.nearby_poi && (
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> Near: {acc.nearby_poi}
                        </div>
                      )}
                      {acc.eco_features?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {acc.eco_features.map((f, j) => (
                            <span key={j} className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                              🌿 {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
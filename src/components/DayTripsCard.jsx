import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Bus, Train, Bike, Footprints, Clock, Zap, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRANSPORT_ICONS = {
  bus: Bus,
  train: Train,
  cycling: Bike,
  walking: Footprints,
  metro: Train,
  tram: Train,
};

const TRANSPORT_COLORS = {
  bus: "bg-orange-100 text-orange-600",
  train: "bg-blue-100 text-blue-600",
  cycling: "bg-green-100 text-green-600",
  walking: "bg-emerald-100 text-emerald-600",
  metro: "bg-purple-100 text-purple-600",
  tram: "bg-cyan-100 text-cyan-600",
};

function TransportBadge({ mode }) {
  const key = mode?.toLowerCase().split(" ")[0];
  const Icon = TRANSPORT_ICONS[key] || Bus;
  const color = TRANSPORT_COLORS[key] || "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {mode}
    </span>
  );
}

export default function DayTripsCard({ dayTrips }) {
  const [expandedTrip, setExpandedTrip] = useState(null);

  if (!dayTrips?.length) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/30">
        <MapPin className="w-4 h-4 text-secondary" />
        <span className="text-sm font-bold">Nearby Day Trips</span>
        <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
          {dayTrips.length} destinations
        </span>
      </div>

      {/* Trip list */}
      <div className="divide-y divide-border/30">
        {dayTrips.map((trip, i) => (
          <div key={i}>
            <button
              onClick={() => setExpandedTrip(expandedTrip === i ? null : i)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 text-base">
                  {trip.emoji || "📍"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{trip.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" /> {trip.distance_from_base}
                    </span>
                    {trip.transport_options?.slice(0, 2).map((t, j) => (
                      <TransportBadge key={j} mode={t.mode} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {trip.eco_rating}
                </span>
                {expandedTrip === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedTrip === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-4 space-y-3 bg-muted/20">
                    {/* Description */}
                    {trip.description && (
                      <p className="text-xs text-muted-foreground pt-2">{trip.description}</p>
                    )}

                    {/* Transport options */}
                    {trip.transport_options?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">🚌 How to Get There</p>
                        <div className="space-y-2">
                          {trip.transport_options.map((t, j) => (
                            <div key={j} className="flex items-start gap-2 bg-card rounded-xl p-2 border border-border/30">
                              <TransportBadge mode={t.mode} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {t.service_number && (
                                    <span className="text-xs font-bold text-foreground">{t.service_number}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">{t.route_info}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                                  <span>⏱ {t.duration}</span>
                                  {t.frequency && <span>🔄 {t.frequency}</span>}
                                  {t.cost && <span>💰 {t.cost}</span>}
                                  {t.carbon_kg != null && (
                                    <span className="text-emerald-600 font-medium">
                                      <Zap className="w-2.5 h-2.5 inline" /> {t.carbon_kg}kg CO₂
                                    </span>
                                  )}
                                </div>
                                {t.booking_url && (
                                  <a
                                    href={t.booking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-secondary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" /> Book Tickets
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day itinerary */}
                    {trip.day_itinerary?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">📅 Suggested Day Plan</p>
                        <div className="space-y-1.5">
                          {trip.day_itinerary.map((item, j) => (
                            <div key={j} className="flex gap-3">
                              <span className="text-[10px] text-muted-foreground w-12 shrink-0 pt-0.5 font-medium">{item.time}</span>
                              <div className="flex-1">
                                <span className="text-xs">{item.activity}</span>
                                {item.eco_tip && (
                                  <div className="text-[10px] text-primary mt-0.5">💡 {item.eco_tip}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best time */}
                    {trip.best_time && (
                      <div className="text-[10px] text-muted-foreground bg-card rounded-xl p-2 border border-border/30">
                        🗓 <span className="font-semibold">Best time to visit:</span> {trip.best_time}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Footprints, Bike, Bus, TrainFront, Leaf, Zap, Route, Filter, ChevronDown, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistance, formatDuration } from "../lib/ecoUtils";
import { Link } from "react-router-dom";
import moment from "moment";

const TRANSPORT_OPTIONS = [
  { key: "all", label: "All Modes", icon: null },
  { key: "walking", label: "Walking", icon: Footprints },
  { key: "cycling", label: "Cycling", icon: Bike },
  { key: "electric_bus", label: "E-Bus", icon: Bus },
  { key: "train", label: "Train", icon: TrainFront },
];

const DATE_OPTIONS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const MODE_COLORS = {
  walking: "bg-green-100 text-green-600",
  cycling: "bg-blue-100 text-blue-600",
  electric_bus: "bg-orange-100 text-orange-600",
  train: "bg-emerald-100 text-emerald-600",
};

const MODE_ICONS = {
  walking: Footprints,
  cycling: Bike,
  electric_bus: Bus,
  train: TrainFront,
};

function filterByDate(trips, range) {
  if (range === "all") return trips;
  const now = moment();
  return trips.filter((t) => {
    const d = moment(t.created_date);
    if (range === "today") return d.isSame(now, "day");
    if (range === "week") return d.isSame(now, "week");
    if (range === "month") return d.isSame(now, "month");
    if (range === "year") return d.isSame(now, "year");
    return true;
  });
}

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transportFilter, setTransportFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const data = await base44.entities.Trip.filter(
        { status: "completed", created_by: me.email },
        "-created_date",
        200
      );
      setTrips(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = trips;
    if (transportFilter !== "all") result = result.filter((t) => t.transport_mode === transportFilter);
    result = filterByDate(result, dateFilter);
    return result;
  }, [trips, transportFilter, dateFilter]);

  const summary = useMemo(() => ({
    totalTrips: filtered.length,
    totalCO2: filtered.reduce((s, t) => s + (t.co2_saved_kg || 0), 0),
    totalPoints: filtered.reduce((s, t) => s + (t.eco_points || 0), 0),
    totalDistance: filtered.reduce((s, t) => s + (t.distance_km || 0), 0),
  }), [filtered]);

  const hasActiveFilters = transportFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setTransportFilter("all");
    setDateFilter("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trip History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{trips.length} completed trips</p>
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border/50"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
              {/* Transport filter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" /> Transport Mode
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTransportFilter(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        transportFilter === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date filter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date Range
                </p>
                <div className="flex flex-wrap gap-2">
                  {DATE_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDateFilter(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        dateFilter === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-destructive font-medium hover:underline">
                  <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Route className="w-3.5 h-3.5 text-primary" />, value: summary.totalTrips, label: "Trips" },
          { icon: <Route className="w-3.5 h-3.5 text-blue-500" />, value: `${summary.totalDistance.toFixed(1)}km`, label: "Distance" },
          { icon: <Leaf className="w-3.5 h-3.5 text-emerald-500" />, value: `${summary.totalCO2.toFixed(1)}kg`, label: "CO₂ Saved" },
          { icon: <Zap className="w-3.5 h-3.5 text-accent" />, value: summary.totalPoints, label: "Points" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trip List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border border-border/50">
          <p className="text-muted-foreground text-sm">No trips found</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-primary mt-2 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trip, i) => {
            const Icon = MODE_ICONS[trip.transport_mode] || Footprints;
            const modeColor = MODE_COLORS[trip.transport_mode] || "bg-muted text-muted-foreground";
            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link to={`/trip/${trip.id}`} className="block">
                  <div className="bg-card border border-border/50 rounded-2xl p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${modeColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm capitalize">
                          {trip.transport_mode?.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {moment(trip.created_date).format("MMM D, YYYY")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDistance(trip.distance_km || 0)}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{formatDuration(trip.duration_seconds || 0)}</span>
                      </div>
                    </div>

                    {/* Eco stats */}
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center justify-end gap-1 text-sm font-bold text-emerald-600">
                        <Leaf className="w-3.5 h-3.5" />
                        {(trip.co2_saved_kg || 0).toFixed(2)}kg
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs text-accent font-semibold">
                        <Zap className="w-3 h-3" />
                        {trip.eco_points || 0} pts
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
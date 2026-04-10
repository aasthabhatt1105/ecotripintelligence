import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Navigation, MessageSquare } from "lucide-react";
import EcosiaWidget from "../components/EcosiaWidget";
import DashboardAnimations from "../components/DashboardAnimations";
import { motion } from "framer-motion";
import EcoScoreCircle from "../components/EcoScoreCircle";
import StatsCard from "../components/StatsCard";
import TripCard from "../components/TripCard";
import DestinationSearch from "../components/DestinationSearch";
import { getEcoGrade, co2ToTrees } from "../lib/ecoUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (!me.onboarded) {
        navigate("/onboarding");
        return;
      }
      const userTrips = await base44.entities.Trip.filter(
        { status: "completed", created_by: me.email },
        "-created_date",
        50
      );
      setUser(me);
      setTrips(userTrips);
      setLoading(false);
    }
    load();
  }, []);

  const totalCO2 = trips.reduce((sum, t) => sum + (t.co2_saved_kg || 0), 0);
  const totalPoints = trips.reduce((sum, t) => sum + (t.eco_points || 0), 0);
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const grade = getEcoGrade(totalPoints);
  const trees = co2ToTrees(totalCO2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <DashboardAnimations />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.full_name?.split(" ")[0] || "Explorer"} 🌱
        </p>
      </motion.div>

      {/* 🛰️ Satellite Explorer — TOP SECTION */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="text-lg font-bold mb-3">🛰️ Satellite Explorer</h2>
        <DestinationSearch />
      </motion.div>

      {/* Score + Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border/50 p-6 flex flex-col items-center justify-center shadow-sm"
        >
          <EcoScoreCircle grade={grade} points={totalPoints} />
          <p className="text-xs text-muted-foreground mt-2 font-medium">Eco Score</p>
        </motion.div>
        <StatsCard
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cloud puffing smoke */}
              <ellipse cx="12" cy="15" rx="7" ry="4.5" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.2"/>
              <ellipse cx="9" cy="13" rx="4" ry="3.5" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.2"/>
              <ellipse cx="14" cy="12.5" rx="3.5" ry="3" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.2"/>
              {/* CO2 text */}
              <text x="9" y="16.5" fontSize="4.5" fontWeight="bold" fill="#15803d" fontFamily="monospace">CO₂</text>
              {/* Arrow down = absorbed */}
              <path d="M12 5 L12 9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 7.5 L12 9.5 L14 7.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          }
          label="CO₂ Saved"
          value={trips.length === 0 ? "—" : totalCO2.toFixed(1)}
          unit={trips.length > 0 ? "kg" : ""}
          color="green"
          delay={0.15}
        />
        <StatsCard
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground */}
              <rect x="6" y="20" width="12" height="2" rx="1" fill="#a3e635" />
              {/* Trunk */}
              <rect x="11" y="14" width="2" height="6" rx="1" fill="#854d0e" />
              {/* Branches */}
              <path d="M12 14 L8 10" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12 L16 8" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Canopy circles */}
              <circle cx="12" cy="8" r="4.5" fill="#4ade80" stroke="#16a34a" strokeWidth="1"/>
              <circle cx="8" cy="10" r="3" fill="#22c55e" stroke="#16a34a" strokeWidth="1"/>
              <circle cx="16" cy="9" r="2.8" fill="#86efac" stroke="#16a34a" strokeWidth="1"/>
              {/* Sparkle */}
              <path d="M19 4 L19.5 5.5 L21 6 L19.5 6.5 L19 8 L18.5 6.5 L17 6 L18.5 5.5Z" fill="#fbbf24"/>
            </svg>
          }
          label="Trees Equiv."
          value={trips.length === 0 ? "—" : trees}
          color="emerald"
          delay={0.2}
        />
        <StatsCard
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Star burst background */}
              <circle cx="12" cy="12" r="9" fill="#fef9c3" stroke="#eab308" strokeWidth="1"/>
              {/* Lightning bolt */}
              <path d="M13.5 3.5 L7 13 L11.5 13 L10.5 20.5 L17 11 L12.5 11 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8"/>
              {/* Shine rays */}
              <line x1="12" y1="1" x2="12" y2="3" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20" y1="5" x2="18.5" y2="6.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="23" y1="12" x2="21" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="2" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4" y1="5" x2="5.5" y2="6.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          label="Eco Points"
          value={trips.length === 0 ? "—" : totalPoints}
          color="accent"
          delay={0.25}
        />
      </div>

      {/* Ecosia Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <EcosiaWidget totalCO2={totalCO2} />
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/track">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow cursor-pointer"
          >
            <Navigation className="w-7 h-7 mb-3" />
            <div className="font-bold text-base">Start Tracking</div>
            <div className="text-sm opacity-80 mt-0.5">Track your eco trip in real time</div>
          </motion.div>
        </Link>
        <Link to="/planner">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-secondary text-secondary-foreground rounded-3xl p-6 shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 transition-shadow cursor-pointer"
          >
            <MessageSquare className="w-7 h-7 mb-3" />
            <div className="font-bold text-base">AI Planner</div>
            <div className="text-sm opacity-80 mt-0.5">Plan your next eco adventure</div>
          </motion.div>
        </Link>
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Trips</h2>
          <span className="text-xs text-muted-foreground">{trips.length} total</span>
        </div>
        {trips.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-border/50">
            <Navigation className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No trips yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start tracking to see your impact!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trips.slice(0, 6).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
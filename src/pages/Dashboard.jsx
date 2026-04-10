import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Leaf, TreePine, Zap, Navigation, MessageSquare } from "lucide-react";
import EcosiaWidget from "../components/EcosiaWidget";
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
    <div className="space-y-8">
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
        <StatsCard icon={<Leaf className="w-4 h-4" />} label="CO₂ Saved" value={trips.length === 0 ? "—" : totalCO2.toFixed(1)} unit={trips.length > 0 ? "kg" : ""} color="primary" delay={0.15} />
        <StatsCard icon={<TreePine className="w-4 h-4" />} label="Trees Equiv." value={trips.length === 0 ? "—" : trees} color="emerald" delay={0.2} />
        <StatsCard icon={<Zap className="w-4 h-4" />} label="Eco Points" value={trips.length === 0 ? "—" : totalPoints} color="accent" delay={0.25} />
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
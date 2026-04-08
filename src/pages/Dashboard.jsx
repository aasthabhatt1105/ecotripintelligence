import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Leaf, TreePine, Zap, Navigation, MessageSquare, Plus } from "lucide-react";
import { motion } from "framer-motion";
import EcoScoreCircle from "../components/EcoScoreCircle";
import StatsCard from "../components/StatsCard";
import TripCard from "../components/TripCard";
import { getEcoGrade, co2ToTrees } from "../lib/ecoUtils";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [me, allTrips] = await Promise.all([
        base44.auth.me(),
        base44.entities.Trip.filter({ status: "completed" }, "-created_date", 50),
      ]);
      setUser(me);
      setTrips(allTrips);
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
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">EcoTrip</h1>
          <p className="text-sm text-muted-foreground">
            Hello, {user?.full_name?.split(" ")[0] || "Explorer"} 🌱
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      {/* Eco Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <EcoScoreCircle grade={grade} points={totalPoints} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          icon={<Leaf className="w-4 h-4" />}
          label="CO₂ Saved"
          value={totalCO2.toFixed(1)}
          unit="kg"
          color="primary"
          delay={0.15}
        />
        <StatsCard
          icon={<TreePine className="w-4 h-4" />}
          label="Trees Equiv."
          value={trees}
          color="emerald"
          delay={0.2}
        />
        <StatsCard
          icon={<Zap className="w-4 h-4" />}
          label="Eco Points"
          value={totalPoints}
          color="accent"
          delay={0.25}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/track">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary text-primary-foreground rounded-3xl p-5 shadow-lg shadow-primary/20"
          >
            <Navigation className="w-6 h-6 mb-3" />
            <div className="font-bold text-sm">Start Tracking</div>
            <div className="text-xs opacity-80 mt-0.5">Track your eco trip</div>
          </motion.div>
        </Link>
        <Link to="/planner">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-secondary text-secondary-foreground rounded-3xl p-5 shadow-lg shadow-secondary/20"
          >
            <MessageSquare className="w-6 h-6 mb-3" />
            <div className="font-bold text-sm">AI Planner</div>
            <div className="text-xs opacity-80 mt-0.5">Plan eco travel</div>
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
          <div className="space-y-3">
            {trips.slice(0, 5).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
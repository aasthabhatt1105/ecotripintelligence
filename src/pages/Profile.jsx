import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, TreePine, Zap, Route, Award, LogOut, Settings, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import EcoScoreCircle from "../components/EcoScoreCircle";
import AchievementBadge from "../components/AchievementBadge";
import { getEcoGrade, co2ToTrees, ACHIEVEMENTS } from "../lib/ecoUtils";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const [allTrips, allAchievements] = await Promise.all([
        base44.entities.Trip.filter({ status: "completed", created_by: me.email }, "-created_date", 100),
        base44.entities.Achievement.filter({ created_by: me.email }, "-created_date", 100),
      ]);
      setUser(me);
      setTrips(allTrips);
      setAchievements(allAchievements);
      setLoading(false);
    }
    load();
  }, []);

  const totalCO2 = trips.reduce((sum, t) => sum + (t.co2_saved_kg || 0), 0);
  const totalPoints = trips.reduce((sum, t) => sum + (t.eco_points || 0), 0);
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const grade = getEcoGrade(totalPoints);
  const unlockedKeys = achievements.map((a) => a.achievement_key);

  // Weekly data for chart
  const weeklyData = (() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => {
      const dayTrips = trips.filter((t) => {
        const d = new Date(t.created_date);
        return d.getDay() === (i === 6 ? 0 : i + 1);
      });
      return {
        day,
        co2: +dayTrips.reduce((s, t) => s + (t.co2_saved_kg || 0), 0).toFixed(2),
        points: dayTrips.reduce((s, t) => s + (t.eco_points || 0), 0),
      };
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={() => base44.auth.logout()}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* User Info + Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5"
      >
        <EcoScoreCircle grade={grade} points={totalPoints} size="md" />
        <div>
          <h2 className="text-lg font-bold">{user?.full_name || "Eco Explorer"}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {user?.bio && <p className="text-xs text-muted-foreground mt-1 italic">"{user.bio}"</p>}
          <div className="flex items-center gap-1 mt-2">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{trips.length} trips completed</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Leaf className="w-3.5 h-3.5" />, v: `${totalCO2.toFixed(1)}kg`, l: "CO₂ Saved" },
          { icon: <TreePine className="w-3.5 h-3.5" />, v: co2ToTrees(totalCO2), l: "Trees" },
          { icon: <Route className="w-3.5 h-3.5" />, v: `${totalDistance.toFixed(1)}km`, l: "Distance" },
          { icon: <Zap className="w-3.5 h-3.5" />, v: totalPoints, l: "Points" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-3 text-center">
            <div className="flex justify-center text-primary mb-1">{s.icon}</div>
            <div className="text-sm font-bold">{s.v}</div>
            <div className="text-[9px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
        {[
          { key: "stats", label: "Weekly Stats", icon: TrendingUp },
          { key: "achievements", label: "Achievements", icon: Award },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "stats" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card rounded-3xl border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-bold mb-3">Weekly CO₂ Saved (kg)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="co2" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-bold mb-3">Weekly Eco Points</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="points" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "achievements" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((ach, i) => (
              <AchievementBadge
                key={ach.key}
                achievement={ach}
                unlocked={unlockedKeys.includes(ach.key)}
                delay={i * 0.05}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
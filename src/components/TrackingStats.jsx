import { Route, Leaf, Zap, Timer, Footprints } from "lucide-react";
import { formatDistance, formatDuration } from "../lib/ecoUtils";

export default function TrackingStats({ distance, co2Saved, points, elapsed, steps, showSteps }) {
  return (
    <div className={`grid gap-2 ${showSteps ? "grid-cols-5" : "grid-cols-4"}`}>
      <StatItem icon={<Route className="w-4 h-4 text-primary" />} value={formatDistance(distance)} label="Distance" />
      <StatItem icon={<Leaf className="w-4 h-4 text-emerald-500" />} value={`${co2Saved.toFixed(2)}kg`} label="CO₂ Saved" />
      <StatItem icon={<Zap className="w-4 h-4 text-accent" />} value={points} label="Points" />
      <StatItem icon={<Timer className="w-4 h-4 text-secondary" />} value={formatDuration(elapsed)} label="Duration" />
      {showSteps && (
        <StatItem icon={<Footprints className="w-4 h-4 text-violet-500" />} value={steps} label="Steps" />
      )}
    </div>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <div className="bg-muted/50 rounded-2xl p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
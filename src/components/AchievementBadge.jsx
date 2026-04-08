import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AchievementBadge({ achievement, unlocked = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
        unlocked
          ? "bg-card border-primary/20 shadow-sm"
          : "bg-muted/50 border-border/30 opacity-60"
      }`}
    >
      <div className="text-3xl mb-1.5">{achievement.icon}</div>
      <div className="text-xs font-semibold text-foreground leading-tight">{achievement.title}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
        {achievement.description}
      </div>
      {!unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      {unlocked && (
        <div className="text-[9px] text-primary font-bold mt-1">+{achievement.points} pts</div>
      )}
    </motion.div>
  );
}
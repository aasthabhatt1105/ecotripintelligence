import { useState } from "react";
import { motion } from "framer-motion";

export default function StatsCard({ icon, label, value, unit, color = "primary", delay = 0 }) {
  const [hovered, setHovered] = useState(false);

  const colorMap = {
    primary: "bg-green-50 dark:bg-green-900/20",
    green: "bg-green-50 dark:bg-green-900/20",
    secondary: "bg-blue-50 dark:bg-blue-900/20",
    accent: "bg-orange-50 dark:bg-orange-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
  };
  const cls = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-3xl p-4 shadow-sm border border-border/50 cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
    >
      <motion.div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls} mb-3`}
        animate={hovered ? { rotate: [0, -15, 15, -10, 10, 0], scale: 1.2 } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <div className="text-xl font-bold text-foreground leading-tight">
        {value}
        {unit && <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}
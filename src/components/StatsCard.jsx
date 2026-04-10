import { useState } from "react";
import { motion } from "framer-motion";

export default function StatsCard({ icon, label, value, unit, color = "primary", delay = 0 }) {
  const [hovered, setHovered] = useState(false);

  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    emerald: "bg-emerald-100 text-emerald-600",
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
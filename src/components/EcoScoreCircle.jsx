import { motion } from "framer-motion";
import { getGradeColor } from "../lib/ecoUtils";

export default function EcoScoreCircle({ grade = "C", points = 0, size = "lg" }) {
  const sizes = {
    sm: { outer: "w-20 h-20", text: "text-2xl", sub: "text-[9px]" },
    md: { outer: "w-28 h-28", text: "text-3xl", sub: "text-xs" },
    lg: { outer: "w-36 h-36", text: "text-4xl", sub: "text-sm" },
  };
  const s = sizes[size] || sizes.lg;

  const gradePercent = {
    "A+": 100, A: 85, B: 65, C: 45, D: 25, F: 10,
  };
  const pct = gradePercent[grade] || 0;
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`${s.outer} relative flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <motion.circle
          cx="64" cy="64" r="58" fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className={`${s.text} font-bold ${getGradeColor(grade)}`}>{grade}</div>
        <div className={`${s.sub} text-muted-foreground font-medium`}>{points.toLocaleString()} pts</div>
      </div>
    </div>
  );
}
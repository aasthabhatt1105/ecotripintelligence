import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SYMBOLS = ["🌍", "🌿", "♻️", "🚴", "🌱", "⚡", "🌳", "💨", "🦋", "🌊", "☀️", "🐢"];

function FloatingSymbol({ symbol, style }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-2xl"
      style={style}
      initial={{ opacity: 0, y: 0, rotate: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.7, 0.7, 0],
        y: [-20, -80, -140, -200],
        rotate: [0, 20, -15, 30],
        scale: [0.5, 1.2, 1, 0.7],
      }}
      transition={{ duration: 3.5, ease: "easeOut" }}
    >
      {symbol}
    </motion.div>
  );
}

export default function DashboardAnimations() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Spawn initial burst
    spawnBurst();
    // Then every 6 seconds spawn a few
    const interval = setInterval(() => {
      spawnBurst(2);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const spawnBurst = (count = 5) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      style: {
        left: `${10 + Math.random() * 80}%`,
        bottom: "0px",
        zIndex: 0,
      },
    }));
    setParticles((p) => [...p, ...newParticles]);
    // Clean up after animation
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newParticles.find((n) => n.id === x.id)));
    }, 4000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <FloatingSymbol key={p.id} symbol={p.symbol} style={p.style} />
      ))}
    </div>
  );
}
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, ExternalLink, ChevronDown, ChevronUp, Leaf } from "lucide-react";

const CO2_PER_TREE = 21; // kg CO2 absorbed per tree per year

export default function EcosiaWidget({ totalCO2 }) {
  const [expanded, setExpanded] = useState(false);
  const treesToPlant = Math.max(0, Math.floor(totalCO2 / CO2_PER_TREE));
  const progress = Math.min(100, ((totalCO2 % CO2_PER_TREE) / CO2_PER_TREE) * 100);
  const kgToNext = CO2_PER_TREE - (totalCO2 % CO2_PER_TREE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              🌍 Ecosia Tree Planting
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {treesToPlant > 0 ? `${treesToPlant} tree${treesToPlant > 1 ? "s" : ""} earned from your CO₂ savings!` : `Save ${CO2_PER_TREE}kg CO₂ to plant your first tree`}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Progress to next tree */}
              <div>
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1.5 font-medium">
                  <span>Progress to next tree</span>
                  <span>{kgToNext.toFixed(1)}kg CO₂ to go</span>
                </div>
                <div className="h-2.5 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Tree count */}
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: Math.min(treesToPlant, 10) }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-xl"
                  >
                    🌳
                  </motion.span>
                ))}
                {treesToPlant > 10 && (
                  <span className="text-xs text-emerald-600 font-bold self-center">+{treesToPlant - 10} more</span>
                )}
                {treesToPlant === 0 && (
                  <span className="text-xs text-emerald-600">Start tracking eco trips to earn trees!</span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/60 dark:bg-emerald-900/30 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-700">{treesToPlant}</div>
                  <div className="text-[10px] text-emerald-600">Trees Earned</div>
                </div>
                <div className="bg-white/60 dark:bg-emerald-900/30 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-700">{totalCO2.toFixed(1)}kg</div>
                  <div className="text-[10px] text-emerald-600">CO₂ Offset</div>
                </div>
              </div>

              {/* Ecosia CTA */}
              <a
                href={`https://www.ecosia.org/search?q=eco+friendly+travel+${treesToPlant}+trees`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-2.5 text-sm font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Plant Trees via Ecosia
              </a>
              <p className="text-[10px] text-emerald-600 text-center">
                Every Ecosia search plants real trees 🌱 — your CO₂ savings unlock tree credits
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import { Footprints, Bike, Bus, TrainFront } from "lucide-react";
import { motion } from "framer-motion";

const modes = [
  { key: "walking", icon: Footprints, label: "Walk", co2: "0 g/km" },
  { key: "cycling", icon: Bike, label: "Bike", co2: "0 g/km" },
  { key: "electric_bus", icon: Bus, label: "E-Bus", co2: "20 g/km" },
  { key: "train", icon: TrainFront, label: "Train", co2: "30 g/km" },
];

export default function TransportSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {modes.map(({ key, icon: Icon, label, co2 }) => {
        const active = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
              active
                ? "border-primary bg-primary/5"
                : "border-transparent bg-muted/50 hover:bg-muted"
            }`}
          >
            {active && (
              <motion.div
                layoutId="transport-active"
                className="absolute inset-0 border-2 border-primary rounded-2xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className={`w-5 h-5 relative z-10 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[11px] font-medium relative z-10 ${active ? "text-primary" : "text-foreground"}`}>
              {label}
            </span>
            <span className="text-[9px] text-muted-foreground relative z-10">{co2}</span>
          </button>
        );
      })}
    </div>
  );
}
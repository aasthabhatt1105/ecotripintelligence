import { Satellite, Wind, Droplets, Thermometer } from "lucide-react";

const metrics = [
  { key: "ndvi", label: "NDVI", icon: Satellite, format: (v) => v.toFixed(2), color: "text-emerald-500" },
  { key: "airQualityIndex", label: "AQI", icon: Wind, format: (v) => v, color: "text-blue-500" },
  { key: "waterQuality", label: "Water", icon: Droplets, format: (v) => `${v}%`, color: "text-cyan-500" },
  { key: "landSurfaceTemp", label: "Temp", icon: Thermometer, format: (v) => `${v}°C`, color: "text-orange-500" },
];

export default function SatelliteDataBadge({ data }) {
  if (!data) return null;

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {metrics.map(({ key, label, icon: Icon, format, color }) => (
        <div
          key={key}
          className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 text-xs"
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-semibold text-foreground">{format(data[key])}</span>
        </div>
      ))}
    </div>
  );
}
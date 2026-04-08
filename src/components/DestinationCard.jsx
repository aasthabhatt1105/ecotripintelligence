import { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { Wind, Droplets, Thermometer, Eye, Gauge, Sun, Factory, Car, MapPin, Calendar, ChevronLeft, ChevronRight, Satellite } from "lucide-react";
import { format, subDays, addDays } from "date-fns";

const AQI_COLORS = {
  Good: "text-green-600 bg-green-100",
  Moderate: "text-yellow-600 bg-yellow-100",
  Unhealthy: "text-orange-600 bg-orange-100",
  Hazardous: "text-red-600 bg-red-100",
};

const CARBON_COLORS = {
  "A+": "text-green-600", A: "text-green-500", B: "text-yellow-500",
  C: "text-orange-500", D: "text-red-400", F: "text-red-600",
};

const TABS = ["Weather", "Air Quality", "Carbon", "Satellite"];

// Map layer types for different satellite views
const SATELLITE_LAYERS = [
  { id: "imagery", label: "True Color", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", desc: "Esri World Imagery" },
  { id: "terrain", label: "Terrain", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", desc: "Topographic" },
  { id: "ndvi", label: "Vegetation", url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}", desc: "National Geographic" },
  { id: "ocean", label: "Physical", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}", desc: "Physical Map" },
];

function PollutantBar({ label, value, max, unit }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct < 33 ? "bg-green-500" : pct < 66 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} {unit}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SatelliteView({ data }) {
  const { lat, lng } = data.coordinates || { lat: 51.5, lng: -0.1 };
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeLayer, setActiveLayer] = useState("imagery");
  const [zoom] = useState(11);

  const layer = SATELLITE_LAYERS.find(l => l.id === activeLayer);

  // Generate last 30 days for the date picker strip
  const dateStrip = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));

  const handlePrevDate = () => setSelectedDate(d => subDays(d, 1));
  const handleNextDate = () => {
    const tomorrow = addDays(selectedDate, 1);
    if (tomorrow <= new Date()) setSelectedDate(tomorrow);
  };

  // Environmental data varies slightly by "date" (simulated from satellite data)
  const dayOffset = Math.floor((new Date() - selectedDate) / (1000 * 60 * 60 * 24));
  const ndviVariance = ((dayOffset % 7) * 0.01).toFixed(2);
  const tempVariance = (dayOffset % 5) * 0.3;
  const displayNDVI = Math.max(0, (data.satellite?.ndvi || 0.65) - ndviVariance).toFixed(2);
  const displayTemp = ((data.satellite?.land_surface_temp || 22) - tempVariance).toFixed(1);
  const displayVeg = Math.max(0, (data.satellite?.vegetation_pct || 40) - dayOffset % 3);
  const isFutureDate = addDays(selectedDate, 1) > new Date();

  return (
    <div className="space-y-3">
      {/* Date header */}
      <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">{format(selectedDate, "dd MMM yyyy")}</span>
          {dayOffset === 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Today</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevDate} className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleNextDate} disabled={isFutureDate} className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Date strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {dateStrip.map((d, i) => {
          const isSelected = format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              className={`shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center transition-all ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              <span className="text-[9px] font-medium">{format(d, "EEE")}</span>
              <span className="text-xs font-bold">{format(d, "d")}</span>
              <span className="text-[8px] opacity-70">{format(d, "MMM")}</span>
            </button>
          );
        })}
      </div>

      {/* Layer selector */}
      <div className="flex gap-2">
        {SATELLITE_LAYERS.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-semibold transition-all border ${
              activeLayer === l.id
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border/50 h-56 relative">
        <MapContainer
          key={`${activeLayer}-${format(selectedDate, "yyyy-MM-dd")}-${lat}-${lng}`}
          center={[lat, lng]}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url={layer.url}
            attribution={`Tiles © Esri — ${layer.desc}`}
            maxZoom={18}
          />
          <CircleMarker
            center={[lat, lng]}
            radius={8}
            pathOptions={{ color: "#fff", fillColor: "#4CAF50", fillOpacity: 1, weight: 3 }}
          />
        </MapContainer>

        {/* Layer badge overlay */}
        <div className="absolute bottom-2 left-2 z-[999] bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
          <Satellite className="w-3 h-3" />
          {layer.label} · {format(selectedDate, "dd MMM yyyy")}
        </div>
      </div>

      {/* Satellite metrics for selected date */}
      <div className="bg-muted/30 rounded-xl px-3 py-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
          📡 Satellite Data — {format(selectedDate, "dd MMM yyyy")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "NDVI", value: displayNDVI, icon: "🌿", sub: "Vegetation" },
            { label: "Land Temp", value: `${displayTemp}°C`, icon: "🌡️", sub: "Surface" },
            { label: "Vegetation", value: `${displayVeg}%`, icon: "🛰️", sub: "Coverage" },
            { label: "Urban", value: `${data.satellite?.urban_density_pct ?? "—"}%`, icon: "🏙️", sub: "Density" },
            { label: "Water", value: `${data.satellite?.water_coverage_pct ?? "—"}%`, icon: "💧", sub: "Coverage" },
            { label: "Resolution", value: "10m", icon: "📷", sub: "Sentinel-2" },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl p-2 text-center border border-border/30">
              <div className="text-base mb-0.5">{item.icon}</div>
              <div className="text-xs font-bold">{item.value}</div>
              <div className="text-[9px] text-muted-foreground">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DestinationCard({ data }) {
  const [tab, setTab] = useState("Satellite");
  const aqiClass = AQI_COLORS[data.air_quality?.category] || "text-muted-foreground bg-muted";
  const carbonColor = CARBON_COLORS[data.carbon?.carbon_score] || "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-primary/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <div>
            <h2 className="font-bold text-base">{data.destination}</h2>
            <p className="text-xs text-muted-foreground">{data.country}</p>
          </div>
        </div>
        <div className="text-3xl">{data.weather?.icon}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-3">
        {tab === "Weather" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{data.weather?.temp}°C</div>
                <div className="text-sm text-muted-foreground capitalize">{data.weather?.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Feels like {data.weather?.feels_like}°C</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="flex items-center gap-1 text-xs"><Droplets className="w-3 h-3 text-blue-500" />{data.weather?.humidity}%</div>
                <div className="flex items-center gap-1 text-xs"><Wind className="w-3 h-3 text-blue-400" />{data.weather?.wind_speed} km/h</div>
                <div className="flex items-center gap-1 text-xs"><Eye className="w-3 h-3 text-slate-400" />{data.atmosphere?.visibility_km} km</div>
                <div className="flex items-center gap-1 text-xs"><Sun className="w-3 h-3 text-yellow-500" />UV {data.atmosphere?.uv_index}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/40 rounded-xl p-2.5 text-center">
                <Gauge className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-sm font-bold">{data.atmosphere?.pressure_hpa} hPa</div>
                <div className="text-[10px] text-muted-foreground">Pressure</div>
              </div>
              <div className="bg-muted/40 rounded-xl p-2.5 text-center">
                <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-sm font-bold">{data.atmosphere?.dew_point}°C</div>
                <div className="text-[10px] text-muted-foreground">Dew Point</div>
              </div>
            </div>
            {data.forecast?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">5-Day Forecast</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {data.forecast.map((f, i) => (
                    <div key={i} className="bg-muted/40 rounded-xl p-2.5 text-center shrink-0 min-w-[56px]">
                      <div className="text-[10px] text-muted-foreground">{f.day}</div>
                      <div className="text-lg my-0.5">{f.icon}</div>
                      <div className="text-xs font-bold">{f.high}°</div>
                      <div className="text-[10px] text-muted-foreground">{f.low}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Air Quality" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{data.air_quality?.aqi}</div>
                <div className="text-xs text-muted-foreground mt-0.5">AQI Score</div>
              </div>
              <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${aqiClass}`}>
                {data.air_quality?.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Main pollutant: <span className="font-semibold text-foreground">{data.air_quality?.main_pollutant}</span></p>
            <div className="space-y-2.5">
              <PollutantBar label="PM2.5" value={data.pollution?.pm25} max={75} unit="µg/m³" />
              <PollutantBar label="PM10" value={data.pollution?.pm10} max={150} unit="µg/m³" />
              <PollutantBar label="NO₂" value={data.pollution?.no2} max={200} unit="µg/m³" />
              <PollutantBar label="O₃" value={data.pollution?.o3} max={180} unit="µg/m³" />
              <PollutantBar label="CO" value={data.pollution?.co} max={10000} unit="µg/m³" />
            </div>
          </div>
        )}

        {tab === "Carbon" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-5xl font-bold ${carbonColor}`}>{data.carbon?.carbon_score}</div>
                <div className="text-xs text-muted-foreground mt-1">Carbon Score</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{data.carbon?.co2_per_capita}</div>
                <div className="text-xs text-muted-foreground">tonnes CO₂/capita/yr</div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />Transport Emissions</span>
                  <span className="font-medium">{data.carbon?.transport_index}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${data.carbon?.transport_index}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1"><Factory className="w-3 h-3" />Industry Emissions</span>
                  <span className="font-medium">{data.carbon?.industry_index}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${data.carbon?.industry_index}%` }} />
                </div>
              </div>
            </div>
            {data.eco_tips?.length > 0 && (
              <div className="bg-primary/5 rounded-2xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-primary">🌿 Eco Travel Tips</p>
                {data.eco_tips.map((tip, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "Satellite" && <SatelliteView data={data} />}
      </div>
    </motion.div>
  );
}
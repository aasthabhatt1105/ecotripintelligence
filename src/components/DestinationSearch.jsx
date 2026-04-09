import { useState, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import DestinationCard from "./DestinationCard";
import { motion, AnimatePresence } from "framer-motion";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ESRI World Imagery satellite tile layer
const ESRI_SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function MapFlyTo({ coords, zoom }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, zoom, { animate: true, duration: 2 });
  }
  return null;
}

// Custom green pin marker
const pinIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:22px;height:32px;position:relative;">
    <svg viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 25 9 25s9-18.25 9-25c0-4.97-4.03-9-9-9z" fill="#4CAF50"/>
      <circle cx="12" cy="9" r="4" fill="white"/>
    </svg>
  </div>`,
  iconSize: [22, 32],
  iconAnchor: [11, 32],
});

export default function DestinationSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [flyZoom, setFlyZoom] = useState(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [showCard, setShowCard] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setShowCard(false);

    // Step 1: Geocode the destination using Nominatim (OpenStreetMap)
    setLoadingStep("Locating destination...");
    let lat = null, lng = null;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch (_) {}

    // Step 2: Fetch real weather + air quality
    setLoadingStep("Fetching live weather & air quality...");
    const weatherResp = await base44.functions.invoke("getWeather", { destination: query });
    const weatherData = weatherResp.data;

    // Use coords from weather API if geocoding failed
    if (!lat && weatherData.coordinates) {
      lat = weatherData.coordinates.lat;
      lng = weatherData.coordinates.lng;
    }

    // Step 3: Fetch carbon + satellite data from LLM
    setLoadingStep("Analyzing satellite & carbon data...");
    const llmData = await base44.integrations.Core.InvokeLLM({
      prompt: `For the destination "${query}" (${weatherData.country || ""}), provide:
- Carbon footprint: annual CO2 emissions per capita (tonnes), transport emissions index (0-100), industry emissions index (0-100), carbon score (A+ to F)
- Satellite environment: vegetation coverage %, urban density %, water body coverage %, NDVI index (-1 to 1), land surface temperature (°C)
- Eco travel tips: 3 short tips for eco-friendly travel
Be realistic and accurate based on the location.`,
      response_json_schema: {
        type: "object",
        properties: {
          carbon: {
            type: "object",
            properties: {
              co2_per_capita: { type: "number" },
              transport_index: { type: "number" },
              industry_index: { type: "number" },
              carbon_score: { type: "string" }
            }
          },
          satellite: {
            type: "object",
            properties: {
              vegetation_pct: { type: "number" },
              urban_density_pct: { type: "number" },
              water_coverage_pct: { type: "number" },
              ndvi: { type: "number" },
              land_surface_temp: { type: "number" }
            }
          },
          eco_tips: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (lat && lng) {
      setMarkerPos([lat, lng]);
      setFlyZoom(12);
    }

    setResult({ ...weatherData, ...llmData, coordinates: { lat, lng } });
    setLoading(false);
    setLoadingStep("");
    setShowCard(true);
  };

  const handleClear = () => {
    setResult(null);
    setShowCard(false);
    setMarkerPos(null);
    setFlyZoom(2);
    setQuery("");
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a destination... (e.g. Tokyo, Paris, Mumbai)"
            className="pl-9 rounded-2xl h-12 bg-card border-border/50"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="rounded-2xl h-12 px-5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Explore"}
        </Button>
      </form>

      {/* Satellite World Map */}
      <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-sm" style={{ height: "340px" }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url={ESRI_SATELLITE_URL}
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={19}
          />
          {markerPos && flyZoom && <MapFlyTo coords={markerPos} zoom={flyZoom} />}
          {markerPos && <Marker position={markerPos} icon={pinIcon} />}
        </MapContainer>

        {/* Loading overlay on map */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-[1000] gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm font-medium">{query}</p>
            <p className="text-white/70 text-xs">{loadingStep}</p>
          </div>
        )}

        {/* Attribution badge */}
        <div className="absolute bottom-2 right-2 z-[999] bg-black/50 text-white/80 text-[9px] px-2 py-0.5 rounded-md backdrop-blur-sm">
          Powered by ESRI World Imagery
        </div>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {showCard && result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="relative"
          >
            <button
              onClick={handleClear}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <DestinationCard data={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
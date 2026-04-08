import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import DestinationCard from "./DestinationCard";

export default function DestinationSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an environmental data expert. For the destination "${query}", provide comprehensive real-time-like data including:
- Current weather conditions (temperature in Celsius, feels like, humidity %, wind speed km/h, description, weather icon emoji)
- 5-day weather forecast (each day: date label like "Mon", temp high/low, description, icon emoji)
- Air quality index (AQI value 0-500, category like Good/Moderate/Unhealthy/Hazardous, main pollutant)
- Pollution levels: PM2.5 (µg/m³), PM10 (µg/m³), NO2 (µg/m³), O3 (µg/m³), CO (µg/m³)
- Carbon footprint data: annual CO2 emissions per capita (tonnes), transport emissions index (0-100), industry emissions index (0-100), overall carbon score (A+ to F)
- Atmosphere data: UV index (0-11+), visibility (km), pressure (hPa), dew point (°C)
- Satellite environment description: vegetation coverage %, urban density %, water body coverage %, NDVI index (-1 to 1), land surface temperature (°C)
- Eco travel tips: 3 short tips for eco-friendly travel to this destination
Use realistic and accurate data based on the location. Return as JSON.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          destination: { type: "string" },
          country: { type: "string" },
          coordinates: {
            type: "object",
            properties: { lat: { type: "number" }, lng: { type: "number" } }
          },
          weather: {
            type: "object",
            properties: {
              temp: { type: "number" },
              feels_like: { type: "number" },
              humidity: { type: "number" },
              wind_speed: { type: "number" },
              description: { type: "string" },
              icon: { type: "string" }
            }
          },
          forecast: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                high: { type: "number" },
                low: { type: "number" },
                description: { type: "string" },
                icon: { type: "string" }
              }
            }
          },
          air_quality: {
            type: "object",
            properties: {
              aqi: { type: "number" },
              category: { type: "string" },
              main_pollutant: { type: "string" }
            }
          },
          pollution: {
            type: "object",
            properties: {
              pm25: { type: "number" },
              pm10: { type: "number" },
              no2: { type: "number" },
              o3: { type: "number" },
              co: { type: "number" }
            }
          },
          carbon: {
            type: "object",
            properties: {
              co2_per_capita: { type: "number" },
              transport_index: { type: "number" },
              industry_index: { type: "number" },
              carbon_score: { type: "string" }
            }
          },
          atmosphere: {
            type: "object",
            properties: {
              uv_index: { type: "number" },
              visibility_km: { type: "number" },
              pressure_hpa: { type: "number" },
              dew_point: { type: "number" }
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

    setResult(data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a destination..."
            className="pl-9 rounded-2xl h-12 bg-card border-border/50"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="rounded-2xl h-12 px-5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Explore"}
        </Button>
      </form>

      {loading && (
        <div className="bg-card rounded-3xl border border-border/50 p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Fetching live data for <span className="font-medium text-foreground">{query}</span>...</p>
        </div>
      )}

      {result && <DestinationCard data={result} />}
    </div>
  );
}
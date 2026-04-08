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
  const [loadingStep, setLoadingStep] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);

    // Step 1: Fetch real weather + air quality from OpenWeatherMap
    setLoadingStep("Fetching live weather & air quality...");
    const weatherResp = await base44.functions.invoke("getWeather", { destination: query });
    const weatherData = weatherResp.data;

    // Step 2: Fetch carbon + satellite + eco tips from LLM (only what OWM doesn't provide)
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

    setResult({ ...weatherData, ...llmData });
    setLoading(false);
    setLoadingStep("");
  };

  return (
    <div className="space-y-4">
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

      {loading && (
        <div className="bg-card rounded-3xl border border-border/50 p-6 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-foreground">{query}</p>
          <p className="text-xs text-muted-foreground">{loadingStep}</p>
        </div>
      )}

      {result && <DestinationCard data={result} />}
    </div>
  );
}
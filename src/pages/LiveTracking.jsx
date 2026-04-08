import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import { Play, Square, Footprints, Bike, Bus, TrainFront, Leaf, Timer, Route, Gauge, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateCO2Saved,
  calculateEcoPoints,
  haversineDistance,
  formatDuration,
  formatDistance,
  TRANSPORT_LABELS,
} from "../lib/ecoUtils";
import TransportSelector from "../components/TransportSelector";
import TrackingStats from "../components/TrackingStats";

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LiveTracking() {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(false);
  const [transportMode, setTransportMode] = useState("walking");
  const [waypoints, setWaypoints] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [tripId, setTripId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const watchRef = useRef(null);
  const timerRef = useRef(null);

  // Get initial position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => setCurrentPos([51.505, -0.09]),
        { enableHighAccuracy: true }
      );
    } else {
      setCurrentPos([51.505, -0.09]);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (tracking && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [tracking, startTime]);

  const handlePositionUpdate = useCallback(
    (position) => {
      const { latitude, longitude } = position.coords;
      const newPoint = [latitude, longitude];
      setCurrentPos(newPoint);

      setWaypoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const d = haversineDistance(last[0], last[1], latitude, longitude);
          if (d > 0.002) {
            setDistance((prevDist) => prevDist + d);
            return [...prev, newPoint];
          }
          return prev;
        }
        return [newPoint];
      });
    },
    []
  );

  const startTracking = async () => {
    const now = Date.now();
    setTracking(true);
    setStartTime(now);
    setDistance(0);
    setElapsed(0);
    setWaypoints(currentPos ? [currentPos] : []);

    const trip = await base44.entities.Trip.create({
      transport_mode: transportMode,
      status: "active",
      start_lat: currentPos?.[0],
      start_lng: currentPos?.[1],
      start_time: new Date(now).toISOString(),
    });
    setTripId(trip.id);

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
  };

  const stopTracking = async () => {
    setTracking(false);
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    clearInterval(timerRef.current);

    const co2 = calculateCO2Saved(distance, transportMode);
    const points = calculateEcoPoints(distance, co2);
    const endTime = new Date().toISOString();

    const summary = {
      distance_km: distance,
      co2_saved_kg: co2,
      eco_points: points,
      duration_seconds: elapsed,
      transport_mode: transportMode,
    };

    if (tripId) {
      await base44.entities.Trip.update(tripId, {
        ...summary,
        status: "completed",
        end_lat: currentPos?.[0],
        end_lng: currentPos?.[1],
        end_time: endTime,
        waypoints: JSON.stringify(waypoints),
      });
    }

    setSummaryData(summary);
    setShowSummary(true);
  };

  const co2Saved = calculateCO2Saved(distance, transportMode);
  const points = calculateEcoPoints(distance, co2Saved);

  return (
    <div className="relative h-screen flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        {currentPos && (
          <MapContainer
            center={currentPos}
            zoom={16}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <MapUpdater center={currentPos} />
            {waypoints.length > 1 && (
              <Polyline
                positions={waypoints}
                pathOptions={{ color: "hsl(122, 39%, 49%)", weight: 4, opacity: 0.8 }}
              />
            )}
            <CircleMarker
              center={currentPos}
              radius={8}
              pathOptions={{ color: "hsl(122, 39%, 49%)", fillColor: "hsl(122, 39%, 49%)", fillOpacity: 1, weight: 3 }}
            />
          </MapContainer>
        )}

        {/* Back button */}
        {!tracking && (
          <button
            onClick={() => navigate("/")}
            className="absolute top-5 left-5 z-[1000] flex items-center gap-2 glass rounded-2xl px-4 py-2 border border-border/50 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* Live indicator */}
        {tracking && (
          <div className="absolute top-5 left-5 z-[1000] flex items-center gap-2 glass rounded-2xl px-4 py-2 border border-border/50">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-ring" />
            </div>
            <span className="text-xs font-bold text-foreground">LIVE</span>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <div className="glass border-t border-border/50 rounded-t-3xl px-5 pt-5 pb-28 space-y-4">
          {!tracking && !showSummary && (
            <TransportSelector selected={transportMode} onSelect={setTransportMode} />
          )}

          {tracking && (
            <TrackingStats
              distance={distance}
              co2Saved={co2Saved}
              points={points}
              elapsed={elapsed}
            />
          )}

          {showSummary && summaryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-bold text-center">Trip Complete! 🎉</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <Route className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">{formatDistance(summaryData.distance_km)}</div>
                  <div className="text-[10px] text-muted-foreground">Distance</div>
                </div>
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">{summaryData.co2_saved_kg.toFixed(2)}kg</div>
                  <div className="text-[10px] text-muted-foreground">CO₂ Saved</div>
                </div>
              </div>
              <Button
                onClick={() => { setShowSummary(false); setSummaryData(null); navigate("/"); }}
                className="w-full rounded-2xl h-12"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          )}

          {!showSummary && (
            <Button
              onClick={tracking ? stopTracking : startTracking}
              className={`w-full h-14 rounded-2xl text-base font-bold transition-all ${
                tracking
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30"
              }`}
            >
              {tracking ? (
                <>
                  <Square className="w-5 h-5 mr-2" /> Stop Trip
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" /> Start Trip
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
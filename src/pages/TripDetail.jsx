import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { ArrowLeft, Leaf, Route, Timer, Zap, Trash2, Share2, Footprints, Bike, Bus, TrainFront, Camera, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { formatDistance, formatDuration } from "../lib/ecoUtils";
import moment from "moment";

const icons = {
  walking: Footprints,
  cycling: Bike,
  electric_bus: Bus,
  train: TrainFront,
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const tripPhotos = (() => {
    if (!trip?.photo_urls) return [];
    try { return JSON.parse(trip.photo_urls); } catch { return []; }
  })();

  useEffect(() => {
    async function load() {
      const data = await base44.entities.Trip.filter({ id }, "", 1);
      setTrip(data[0] || null);
      setLoading(false);
    }
    load();
  }, [id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const currentPhotos = (() => {
      if (!trip?.photo_urls) return [];
      try { return JSON.parse(trip.photo_urls); } catch { return []; }
    })();
    const newPhotos = [...currentPhotos, file_url];
    await base44.entities.Trip.update(id, { photo_urls: JSON.stringify(newPhotos) });
    setTrip((prev) => ({ ...prev, photo_urls: JSON.stringify(newPhotos) }));
    setUploadingPhoto(false);
  };

  const handleDeletePhoto = async (urlToRemove) => {
    const newPhotos = tripPhotos.filter((u) => u !== urlToRemove);
    await base44.entities.Trip.update(id, { photo_urls: JSON.stringify(newPhotos) });
    setTrip((prev) => ({ ...prev, photo_urls: JSON.stringify(newPhotos) }));
  };

  const handleDelete = async () => {
    if (!confirm("Delete this trip?")) return;
    await base44.entities.Trip.delete(id);
    navigate("/");
  };

  const handleShare = () => {
    if (navigator.share && trip) {
      navigator.share({
        title: "My EcoTrip",
        text: `I traveled ${formatDistance(trip.distance_km)} and saved ${trip.co2_saved_kg?.toFixed(2)}kg of CO₂! 🌱`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-5 pt-6 text-center">
        <p className="text-muted-foreground">Trip not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const waypoints = (() => {
    if (!trip.waypoints) return [];
    return JSON.parse(trip.waypoints);
  })();
  const Icon = icons[trip.transport_mode] || Footprints;
  const center = waypoints.length > 0 ? waypoints[Math.floor(waypoints.length / 2)] : [trip.start_lat || 51.505, trip.start_lng || -0.09];

  return (
    <div className="flex flex-col h-screen">
      {/* Map */}
      <div className="h-[45%] relative">
        <MapContainer center={center} zoom={14} className="h-full w-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {waypoints.length > 1 && (
            <Polyline
              positions={waypoints}
              pathOptions={{ color: "hsl(122, 39%, 49%)", weight: 4, opacity: 0.8 }}
            />
          )}
          {waypoints.length > 0 && (
            <>
              <CircleMarker
                center={waypoints[0]}
                radius={6}
                pathOptions={{ color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 1, weight: 2 }}
              />
              <CircleMarker
                center={waypoints[waypoints.length - 1]}
                radius={6}
                pathOptions={{ color: "#FF6B35", fillColor: "#FF6B35", fillOpacity: 1, weight: 2 }}
              />
            </>
          )}
        </MapContainer>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 z-[1000] w-10 h-10 rounded-xl glass border border-border/50 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Details */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 bg-background rounded-t-3xl -mt-6 relative z-10 px-5 pt-6 pb-28 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold capitalize">{trip.transport_mode?.replace("_", " ")} Trip</h1>
            <p className="text-sm text-muted-foreground">{moment(trip.created_date).format("MMMM D, YYYY · h:mm A")}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={<Route className="w-5 h-5 text-primary" />} label="Distance" value={formatDistance(trip.distance_km || 0)} />
          <StatCard icon={<Leaf className="w-5 h-5 text-emerald-500" />} label="CO₂ Saved" value={`${(trip.co2_saved_kg || 0).toFixed(2)}kg`} />
          <StatCard icon={<Timer className="w-5 h-5 text-secondary" />} label="Duration" value={formatDuration(trip.duration_seconds || 0)} />
          <StatCard icon={<Zap className="w-5 h-5 text-accent" />} label="Eco Points" value={trip.eco_points || 0} />
        </div>

        {/* Impact summary */}
        <div className="bg-primary/5 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-bold mb-2">🌿 Environmental Impact</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By choosing {trip.transport_mode?.replace("_", " ")} instead of driving, you saved approximately{" "}
            <span className="text-primary font-semibold">{(trip.co2_saved_kg || 0).toFixed(2)}kg of CO₂</span>.
            That's equivalent to {((trip.co2_saved_kg || 0) / 22).toFixed(2)} trees absorbing carbon for a year! 🌳
          </p>
        </div>

        {/* Trip Photos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">📸 Trip Photos</h3>
            <label className="flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
          {tripPhotos.length === 0 ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
              <Camera className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Upload photos from this trip</p>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {tripPhotos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} alt={`Trip photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeletePhoto(url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleShare} variant="outline" className="flex-1 rounded-2xl h-12">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button onClick={handleDelete} variant="outline" className="flex-1 rounded-2xl h-12 text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-lg font-bold">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
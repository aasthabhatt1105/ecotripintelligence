import { Link } from "react-router-dom";
import { Footprints, Bike, Bus, TrainFront, ChevronRight, Leaf } from "lucide-react";
import { formatDistance, formatDuration } from "../lib/ecoUtils";
import moment from "moment";

const icons = {
  walking: Footprints,
  cycling: Bike,
  electric_bus: Bus,
  train: TrainFront,
};

export default function TripCard({ trip }) {
  const Icon = icons[trip.transport_mode] || Footprints;

  return (
    <Link to={`/trip/${trip.id}`} className="block">
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm capitalize">
              {trip.transport_mode?.replace("_", " ")}
            </span>
            {trip.status === "active" && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                LIVE
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatDistance(trip.distance_km || 0)} · {formatDuration(trip.duration_seconds || 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            {moment(trip.created_date).fromNow()}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
            <Leaf className="w-3.5 h-3.5" />
            {(trip.co2_saved_kg || 0).toFixed(2)}kg
          </div>
          <div className="text-[10px] text-muted-foreground">{trip.eco_points || 0} pts</div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
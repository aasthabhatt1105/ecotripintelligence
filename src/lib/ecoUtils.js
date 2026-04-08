// Carbon emission rates in kg CO2 per km
export const CARBON_RATES = {
  walking: 0,
  cycling: 0,
  electric_bus: 0.02,
  train: 0.03,
  car: 0.18,
};

export const TRANSPORT_LABELS = {
  walking: "Walking",
  cycling: "Cycling",
  electric_bus: "Electric Bus",
  train: "Train",
};

export const TRANSPORT_ICONS = {
  walking: "Footprints",
  cycling: "Bike",
  electric_bus: "Bus",
  train: "TrainFront",
};

export function calculateCO2Saved(distanceKm, transportMode) {
  const modeRate = CARBON_RATES[transportMode] || 0;
  const carRate = CARBON_RATES.car;
  return Math.max(0, (carRate - modeRate) * distanceKm);
}

export function calculateEcoPoints(distanceKm, co2Saved) {
  const basePoints = distanceKm * 10;
  const bonusPoints = co2Saved * 100;
  return Math.round(basePoints + bonusPoints);
}

export function getEcoGrade(totalPoints) {
  if (totalPoints >= 5000) return "A+";
  if (totalPoints >= 3000) return "A";
  if (totalPoints >= 1500) return "B";
  if (totalPoints >= 500) return "C";
  if (totalPoints >= 100) return "D";
  return "F";
}

export function getGradeColor(grade) {
  const colors = {
    "A+": "text-emerald-500",
    A: "text-green-500",
    B: "text-blue-500",
    C: "text-yellow-500",
    D: "text-orange-500",
    F: "text-red-500",
  };
  return colors[grade] || "text-muted-foreground";
}

export function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(2)}km`;
}

export function co2ToTrees(co2Kg) {
  // Average tree absorbs ~22kg CO2 per year
  return (co2Kg / 22).toFixed(1);
}

export function generateSatelliteData(lat, lng) {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453) % 1;
  return {
    ndvi: +(0.6 + seed * 0.3).toFixed(2),
    airQualityIndex: Math.round(20 + seed * 40),
    waterQuality: Math.round(80 + seed * 15),
    landSurfaceTemp: +(20 + seed * 10).toFixed(1),
    lastUpdated: new Date().toISOString(),
  };
}

export function generateWeatherForecast(destination) {
  const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const temp = 22 + Math.round(Math.random() * 8);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const travelScore = condition === "Sunny" ? 90 + Math.round(Math.random() * 10) :
      condition === "Light Rain" ? 40 + Math.round(Math.random() * 20) :
        60 + Math.round(Math.random() * 25);
    days.push({
      day: i,
      temp,
      condition,
      travelScore,
    });
  }
  return days;
}

// Haversine formula for distance between two GPS coordinates
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Achievement definitions
export const ACHIEVEMENTS = [
  { key: "first_trip", title: "First Steps", description: "Complete your first trip", icon: "🎉", points: 100, check: (stats) => stats.totalTrips >= 1 },
  { key: "distance_10km", title: "Distance Master", description: "Travel 10km+ in a single trip", icon: "🏃", points: 200, check: (_, trip) => trip && trip.distance_km >= 10 },
  { key: "distance_50km", title: "Road Warrior", description: "Travel 50km+ total", icon: "🛤️", points: 300, check: (stats) => stats.totalDistance >= 50 },
  { key: "carbon_5kg", title: "Carbon Saver", description: "Save 5kg+ CO₂", icon: "🌿", points: 250, check: (stats) => stats.totalCO2 >= 5 },
  { key: "carbon_50kg", title: "Planet Guardian", description: "Save 50kg+ CO₂", icon: "🌍", points: 500, check: (stats) => stats.totalCO2 >= 50 },
  { key: "eco_warrior", title: "Eco Warrior", description: "Earn 500+ eco points", icon: "🏆", points: 500, check: (stats) => stats.totalPoints >= 500 },
  { key: "streak_7", title: "Consistency King", description: "7-day trip streak", icon: "🔥", points: 400, check: (stats) => stats.streak >= 7 },
];
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function buildResponse(lat, lng, name, country, weatherData, apiKey) {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Forecast
  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
  );
  const forecastData = await forecastRes.json();

  // Air pollution
  const pollutionRes = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`
  );
  const pollutionData = await pollutionRes.json();

  // Process forecast: one entry per day
  const dayMap = {};
  for (const item of forecastData.list || []) {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split("T")[0];
    if (!dayMap[dayKey]) {
      dayMap[dayKey] = {
        day: dayLabels[date.getDay()],
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        description: item.weather[0].description,
        icon: getWeatherEmoji(item.weather[0].main),
      };
    }
  }
  const forecast = Object.values(dayMap).slice(0, 5);

  // Process pollution
  const aqiRaw = pollutionData?.list?.[0]?.main?.aqi || 1;
  const components = pollutionData?.list?.[0]?.components || {};
  const aqiCategories = { 1: "Good", 2: "Moderate", 3: "Moderate", 4: "Unhealthy", 5: "Hazardous" };

  const currentWeather = weatherData.weather?.[0];

  return Response.json({
    destination: name,
    country,
    coordinates: { lat, lng },
    weather: {
      temp: Math.round(weatherData.main.temp),
      feels_like: Math.round(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      wind_speed: Math.round((weatherData.wind?.speed || 0) * 3.6),
      description: currentWeather?.description || "",
      icon: getWeatherEmoji(currentWeather?.main || ""),
    },
    atmosphere: {
      uv_index: null,
      visibility_km: Math.round((weatherData.visibility || 10000) / 1000),
      pressure_hpa: weatherData.main.pressure,
      dew_point: Math.round(weatherData.main.temp - ((100 - weatherData.main.humidity) / 5)),
    },
    forecast,
    air_quality: {
      aqi: aqiRaw * 20,
      category: aqiCategories[aqiRaw] || "Moderate",
      main_pollutant: getPrimaryPollutant(components),
    },
    pollution: {
      pm25: components.pm2_5 || 0,
      pm10: components.pm10 || 0,
      no2: components.no2 || 0,
      o3: components.o3 || 0,
      co: components.co || 0,
    },
  });
}

function getWeatherEmoji(main) {
  const map = {
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
    Haze: "🌫️", Smoke: "🌫️", Dust: "🌪️", Tornado: "🌪️",
  };
  return map[main] || "🌤️";
}

function getPrimaryPollutant(components) {
  const pollutants = [
    { name: "PM2.5", value: components.pm2_5 || 0 },
    { name: "PM10", value: components.pm10 || 0 },
    { name: "NO₂", value: components.no2 || 0 },
    { name: "O₃", value: components.o3 || 0 },
  ];
  return pollutants.sort((a, b) => b.value - a.value)[0]?.name || "PM2.5";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { destination } = await req.json();
    if (!destination) return Response.json({ error: 'destination is required' }, { status: 400 });

    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");

    // Geocode destination — try direct city lookup first (more reliable)
    const directRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=metric`
    );
    const directData = await directRes.json();
    console.log("OWM direct response cod:", directData.cod, "message:", directData.message);

    if (directData.cod === 200) {
      return await buildResponse(
        directData.coord.lat, directData.coord.lon,
        directData.name, directData.sys?.country || "",
        directData, apiKey
      );
    }

    // Fallback: geocoding API
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();
    console.log("Geo API response:", JSON.stringify(geoData).slice(0, 200));

    if (!geoData || !Array.isArray(geoData) || geoData.length === 0) {
      return Response.json({ error: `Location "${destination}" not found. API message: ${directData.message || "unknown"}` }, { status: 404 });
    }

    const { lat, lon: lng, name, country } = geoData[0];

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );
    const weatherData = await weatherRes.json();

    return await buildResponse(lat, lng, name, country, weatherData, apiKey);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
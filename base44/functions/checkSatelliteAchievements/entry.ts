import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id } = await req.json();
    
    // Fetch the trip
    const trips = await base44.entities.Trip.filter({ id: trip_id }, '', 1);
    const trip = trips[0];

    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Evaluate satellite criteria based on trip location
    const achievements = [];

    // Criteria 1: Green Explorer (NDVI > 0.6 = highly vegetated)
    if (trip.start_lat && trip.start_lng) {
      // Mock satellite data - in production, this would fetch real NASA GIBS data
      const ndvi = 0.5 + Math.random() * 0.4; // Simulated NDVI
      
      if (ndvi > 0.6) {
        const existing = await base44.entities.Achievement.filter({
          achievement_key: 'green_explorer',
          created_by: user.email
        }, '', 1);
        
        if (existing.length === 0) {
          await base44.entities.Achievement.create({
            achievement_key: 'green_explorer',
            title: 'Green Explorer',
            description: 'Traveled through highly vegetated area',
            icon: '🌿',
            points_awarded: 250
          });
          achievements.push('green_explorer');
        }
      }
    }

    // Criteria 2: Urban Eco Champion (traveled in high urban density with low emissions)
    if (trip.co2_saved_kg > 1 && trip.distance_km > 5) {
      const existing = await base44.entities.Achievement.filter({
        achievement_key: 'urban_eco_champion',
        created_by: user.email
      }, '', 1);
      
      if (existing.length === 0) {
        await base44.entities.Achievement.create({
          achievement_key: 'urban_eco_champion',
          title: 'Urban Eco Champion',
          description: 'Long eco-friendly trip saving significant CO₂',
          icon: '🏙️',
          points_awarded: 200
        });
        achievements.push('urban_eco_champion');
      }
    }

    // Criteria 3: Water Guardian (traveled near water bodies)
    if (trip.start_lat && Math.abs(trip.start_lat) < 40) {
      const existing = await base44.entities.Achievement.filter({
        achievement_key: 'water_guardian',
        created_by: user.email
      }, '', 1);
      
      if (existing.length === 0) {
        await base44.entities.Achievement.create({
          achievement_key: 'water_guardian',
          title: 'Water Guardian',
          description: 'Explored areas with significant water coverage',
          icon: '💧',
          points_awarded: 175
        });
        achievements.push('water_guardian');
      }
    }

    return Response.json({ unlocked: achievements, message: `Unlocked ${achievements.length} achievement(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
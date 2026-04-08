import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate total eco points from completed trips
    const trips = await base44.entities.Trip.filter(
      { status: 'completed', created_by: user.email },
      '',
      1000
    );

    const totalPoints = trips.reduce((sum, trip) => sum + (trip.eco_points || 0), 0);

    // Check if user already claimed the badge
    const existingOrder = await base44.entities.BadgeOrder.filter(
      { created_by: user.email },
      '',
      1
    );

    if (totalPoints >= 2000 && existingOrder.length === 0) {
      // User is eligible for the badge
      return Response.json({
        eligible: true,
        totalPoints,
        message: 'Congratulations! You\'ve earned the EcoTrip Champion Badge!'
      });
    } else if (existingOrder.length > 0) {
      return Response.json({
        eligible: false,
        totalPoints,
        message: 'You\'ve already claimed your badge!',
        order: existingOrder[0]
      });
    } else {
      return Response.json({
        eligible: false,
        totalPoints,
        pointsNeeded: Math.max(0, 2000 - totalPoints),
        message: `You need ${Math.max(0, 2000 - totalPoints)} more points to earn the badge.`
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
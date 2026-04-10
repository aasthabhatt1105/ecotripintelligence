import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This function is called by the entity automation when a trip is completed
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data, event } = payload;

    // Only act on completed trips
    if (data?.status !== "completed") {
      return Response.json({ skipped: true });
    }

    const userEmail = data.created_by;
    if (!userEmail) return Response.json({ skipped: true, reason: "no user email" });

    // Get total eco points for this user
    const trips = await base44.asServiceRole.entities.Trip.filter({
      status: "completed",
      created_by: userEmail,
    });

    const totalPoints = trips.reduce((sum, t) => sum + (t.eco_points || 0), 0);

    // Call the promo sending function
    const result = await base44.asServiceRole.functions.invoke("sendPromoCode", {
      user_email: userEmail,
      total_points: totalPoints,
    });

    return Response.json({ success: true, totalPoints, promoResult: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
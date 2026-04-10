import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MILESTONES = [
  { points: 500,  discount: "5%",  code: "ECO5",   message: "You're an eco warrior starter! 🌱" },
  { points: 1000, discount: "10%", code: "ECO10",  message: "Green machine activated! 🚴‍♂️" },
  { points: 2000, discount: "15%", code: "ECO15",  message: "Planet hero status unlocked! 🌍" },
  { points: 5000, discount: "25%", code: "ECO25",  message: "Legendary eco champion! 🏆🌳" },
];

function getMilestone(points) {
  // Return highest milestone reached
  let reached = null;
  for (const m of MILESTONES) {
    if (points >= m.points) reached = m;
  }
  return reached;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, total_points } = await req.json();

    if (!user_email || total_points == null) {
      return Response.json({ error: "Missing user_email or total_points" }, { status: 400 });
    }

    const milestone = getMilestone(total_points);
    if (!milestone) {
      return Response.json({ sent: false, reason: "No milestone reached yet" });
    }

    // Check if we already sent this promo code to this user
    const existing = await base44.asServiceRole.entities.Achievement.filter({
      created_by: user_email,
      achievement_key: `promo_${milestone.code}`,
    });

    if (existing.length > 0) {
      return Response.json({ sent: false, reason: "Promo already sent for this milestone" });
    }

    // Generate unique promo code
    const uniqueCode = `${milestone.code}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      subject: `🎉 You've earned a ${milestone.discount} travel discount! | EcoTrip`,
      body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f0fdf4; padding: 32px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 40px 32px; text-align: center;">
      <div style="font-size: 56px; margin-bottom: 12px;">🌍✈️🌱</div>
      <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800;">Congrats, Eco Hero!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">${milestone.message}</p>
    </div>

    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You've reached <strong>${total_points} Eco Points</strong> — that's seriously impressive! 
        As a reward for your planet-saving travel choices, here's a special discount code just for you:
      </p>

      <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #16a34a; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Promo Code</p>
        <div style="font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 4px; font-family: monospace;">${uniqueCode}</div>
        <p style="color: #16a34a; font-size: 20px; font-weight: 700; margin: 8px 0 0;">${milestone.discount} OFF</p>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
        ✅ Valid on <strong>bus & train ticket bookings</strong><br/>
        ✅ Apply code at checkout<br/>
        ✅ Celebrate your green journey! 🎊
      </p>

      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Keep tracking eco trips to unlock even bigger discounts! 🚴‍♀️🌳
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">— The EcoTrip Intelligence Team 🌿</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    // Record that we sent this promo so we don't send again
    await base44.asServiceRole.entities.Achievement.create({
      achievement_key: `promo_${milestone.code}`,
      title: `${milestone.discount} Promo Sent`,
      description: `Promo code ${uniqueCode} sent at ${total_points} points`,
      points_awarded: 0,
      unlocked_at: new Date().toISOString(),
      created_by: user_email,
    });

    return Response.json({ sent: true, code: uniqueCode, milestone: milestone.discount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
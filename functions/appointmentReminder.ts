import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Scheduled every 15 minutes.
 * Sends a reminder notification to agent + buyer for confirmed appointments
 * starting between 55 and 75 minutes from now (window accounts for run jitter).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now         = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 75 * 60 * 1000);

    // Pull confirmed appointments — filter by date on the backend
    const todayStr     = now.toISOString().split("T")[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr  = tomorrowDate.toISOString().split("T")[0];

    const appointments = await base44.asServiceRole.entities.Appointment.filter(
      { status: "confirmed" }, "-date", 200
    );

    let remindersSent = 0;

    for (const appt of appointments) {
      if (!appt.date || !appt.start_time) continue;
      if (appt.date !== todayStr && appt.date !== tomorrowStr) continue;

      const [h, m] = appt.start_time.split(":").map(Number);
      const apptTime = new Date(appt.date + "T00:00:00");
      apptTime.setHours(h, m, 0, 0);

      if (apptTime < windowStart || apptTime > windowEnd) continue;

      const dateLabel = apptTime.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

      for (const email of [appt.agent_email, appt.buyer_email].filter(Boolean)) {
        const refId = `reminder_${appt.id}_${email}`;
        const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
        if (existing.length > 0) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_email: email,
          type:       "appointment_reminder",
          title:      `⏰ Rappel — visite dans 1 heure`,
          body:       `${appt.listing_title || "Bien"} · ${dateLabel} à ${appt.start_time}`,
          url:        "Appointments",
          is_read:    false,
          ref_id:     refId,
        });
        remindersSent++;
      }
    }

    return Response.json({ ok: true, reminders_sent: remindersSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
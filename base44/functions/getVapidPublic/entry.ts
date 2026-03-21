import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!vapidPublic) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY not configured' },
        { status: 500 }
      );
    }

    // Return as plain text or JSON
    if (req.headers.get('accept')?.includes('application/json')) {
      return Response.json({ vapidPublic });
    }

    return new Response(vapidPublic, {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
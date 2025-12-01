import webPush from 'web-push';

/**
 * Cloudflare Pages Function to send Web Push Notifications
 * * SETUP REQUIREMENTS:
 * 1. Install dependencies: `npm install web-push`
 * 2. Add 'nodejs_compat' to Compatibility Flags in Cloudflare Dashboard
 * 3. Set Environment Variables in Cloudflare Dashboard:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_EMAIL
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Setup CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 2. Configure VAPID
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_EMAIL || 'mailto:example@yourdomain.org';

  if (!publicKey || !privateKey) {
    return new Response(JSON.stringify({ error: "Missing VAPID keys in environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    
    // 3. Parse Body (Cloudflare specific: request.json())
    const body = await request.json();
    
    const subscription = body.subscription;
    const payload = JSON.stringify(body.payload || {
      title: "Default Title",
      body: "Default notification body"
    });

    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Missing subscription object' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Send Notification
    await webPush.sendNotification(subscription, payload);

    return new Response(JSON.stringify({ success: true, message: 'Notification sent successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending push:', error);

    // 410 Gone means the user has revoked permission
    if (error.statusCode === 410) {
      return new Response(JSON.stringify({ error: 'Subscription is no longer valid (Gone).' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to send notification.', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS requests for CORS (Preflight)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}

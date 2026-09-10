/**
 * Serves browser-safe public config from Netlify environment variables.
 * Never put service_role, captcha SECRET, or other private keys here.
 */
exports.handler = async function () {
  var body = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    captchaProvider: process.env.CAPTCHA_PROVIDER || 'turnstile',
    captchaSiteKey: process.env.CAPTCHA_SITE_KEY || '',
    posthogKey: process.env.POSTHOG_KEY || '',
    posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    contactEmail: process.env.CONTACT_EMAIL || ''
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    },
    body: JSON.stringify(body)
  };
};

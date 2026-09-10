// Copy to config.local.js for local file:// or non-Netlify testing.
// config.local.js is gitignored — never commit real keys.
window.__NS_LOCAL_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  captchaProvider: 'turnstile',
  captchaSiteKey: '',
  posthogKey: '',
  posthogHost: 'https://us.i.posthog.com'
};

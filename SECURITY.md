# Neurosync security & launch checklist

## Done in the codebase
- [x] `.gitignore` + `.env.example` (no service_role in client)
- [x] Public config served from Netlify function `/api/public-config` (env vars), not hardcoded in HTML
- [x] Admin UI gated by `profiles.is_admin` only (no personal email in client)
- [x] Demo login disabled when Supabase is configured
- [x] Password min length 8 + client auth rate limiting
- [x] External URL allowlist (`http`/`https` only) for resources
- [x] Stronger attribute escaping (`'`)
- [x] Security headers via `netlify.toml` (CSP, frame deny, nosniff, referrer)
- [x] `robots.txt`, `sitemap.xml`, custom `404.html`
- [x] `privacy.html` + `terms.html` + footer links
- [x] Meta title/description, OG tags, favicon, canonical
- [x] Cookie/analytics consent banner (shows only if PostHog key is set)
- [x] Optional PostHog via host env (`POSTHOG_KEY`)
- [x] SQL hardening notes: `supabase-security-hardening.sql`

## Keys: what goes where
| Value | Where it lives | In browser? |
| --- | --- | --- |
| Supabase **anon** key | Netlify env → `/api/public-config` | Yes (required for login; protected by RLS) |
| Captcha **site** key | Netlify env → `/api/public-config` | Yes (public by design) |
| PostHog project key | Netlify env → `/api/public-config` | Yes (public; consent still required) |
| Supabase **service_role** | Supabase dashboard only | **Never** |
| Captcha **secret** | Supabase Bot & Abuse / provider dashboard | **Never** |

## You must do in Supabase / hosting
1. **Authentication → Providers → Email** enabled; Confirm email ON for production.
2. **Authentication → URL Configuration**: Site URL + Redirect URLs = your live domain.
3. Run SQL so **your user** has `is_admin = true` (Admin tab will not appear otherwise).
4. Review/run `supabase-security-hardening.sql` so profiles are not world-readable with emails.
5. Deploy on **Netlify** so headers + `/api/public-config` work (static `file://` needs `config.local.js`).
6. In Netlify → Site settings → Environment variables, set at least `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see `.env.example`). Never add `service_role`.
7. For local testing: copy `config.local.example.js` → `config.local.js`, or run `netlify dev` with a `.env` file.

## PostHog
1. Create a project at posthog.com.
2. Set `POSTHOG_KEY` (and optional `POSTHOG_HOST`) in Netlify env.
3. Republish. Users see a consent banner; analytics loads only after Accept.

## Honest limits of a vibe-coded static app
- Client-side checks are not enough — **RLS** is the real lock.
- Client rate limits can be bypassed; use Supabase Auth rate limits / CAPTCHA for serious abuse.
- Mobile CSS exists; still test on a phone.
- Accessibility and broken external resource links need ongoing QA.
- The Expo/`package.json` app is legacy and unused by the live HTML site.

## Goal
Support DLT-compliant query-parameter blog URLs (e.g. `https://shraddha.hosla.in/blog?slug=bank-the-inner-bank-15e69f`) for SMS notifications, without breaking the existing `/blog/:slug` path URLs used everywhere else (SEO, sharing, OG previews).

## Why not change `/blog/xxx` → `?blog?xxx`
- `?blog?xxx` is not a valid URL (only one `?` is allowed; the second `?` becomes part of the query string).
- Replacing `/blog/:slug` with `/blog?slug=` sitewide would break every existing shared link, WhatsApp share, Google index entry, OG preview, and the `blog-preview` edge function's crawler routing.
- We only need the query form to satisfy the DLT validator for SMS links — nothing else.

## Recommended approach — dual routing
Make `/blog?slug=xxx` a valid alternative that renders the same blog, then use only that form in SMS. Keep `/blog/:slug` as the canonical URL for everything else.

### Changes

1. **`src/pages/Blog.tsx`** — on mount, if `location.search` has `?slug=<value>`, redirect (`navigate(`/blog/${slug}`, { replace: true })`) so the existing BlogRead page loads. This means the DLT-whitelisted `https://shraddha.hosla.in/blog?slug=...` works for real users; the URL bar then shows the canonical path.
   - Alternative (if you prefer the URL to stay as `?slug=`): render `<BlogRead>` inline from `Blog.tsx` when a `slug` query param is present, without redirecting. Slightly more code but keeps the DLT-form URL visible.

2. **SMS notification templates (DLT registration + `publish-blog` edge function)** — whenever a blog URL is placed inside an SMS body, format it as:
   ```
   https://shraddha.hosla.in/blog?slug=<slug>
   ```
   DLT registration then uses:
   - URL: `https://shraddha.hosla.in/blog?`
   - Sample: `https://shraddha.hosla.in/blog?slug=bank-the-inner-bank-15e69f`
   These match the validator.

3. **Everywhere else (email notifications, social share, OG previews, sitemap, admin links, `blog-preview` function)** — keep using `/blog/:slug`. No change. Preserves SEO and existing shared links.

### Which sub-option do you want?
- **A. Redirect** `?slug=` → `/blog/:slug` on arrival (simpler, cleaner URL bar, still passes DLT because the whitelisted link is what's *sent* in the SMS — user redirect after click is allowed by DLT).
- **B. Render in place** at `/blog?slug=...` (URL stays in query form after click).

Option A is the standard pattern and what most DLT-registered sites do. I'd recommend A unless you know your operator inspects post-redirect URLs.

## Out of scope
- No changes to sitemap, RSS, OG cards, edge functions serving crawlers, or existing shared paths.
- No schema changes.

## Technical notes
- React Router: read `useSearchParams()` in `Blog.tsx`; if `slug` present, call `navigate` in a `useEffect` before the listing renders.
- SPA fallback on Lovable hosting already serves `index.html` for `/blog` with any query string, so no infra config needed.

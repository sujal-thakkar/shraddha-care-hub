## Problem
DLT whitelisting accepted `https://shraddha.hosla.in/blog?` as the dynamic URL prefix. The SMS links being generated look like:

```
https://shraddha.hosla.in/blog?gita-dhyanam-3be702
```

Not `?slug=gita-dhyanam-3be702`. The current `Blog.tsx` redirect only handles `?slug=<value>` (via `searchParams.get("slug")`), so a bare `?<slug>` query string has no matching key and the page just renders the blog listing.

## Fix
Extend the redirect logic in `src/pages/Blog.tsx` to accept **both** query formats:

1. `?slug=<slug>` — existing behavior (keyed param).
2. `?<slug>` — new: when `location.search` is a single token with no `=`, treat everything after `?` as the slug.

Pseudocode inside the existing `useEffect`:

```ts
const raw = location.search.replace(/^\?/, "");
let slug = searchParams.get("slug");
if (!slug && raw && !raw.includes("=") && !raw.includes("&")) {
  slug = decodeURIComponent(raw);
}
if (slug) navigate(`/blog/${slug}`, { replace: true });
```

Guard against accidentally matching real query strings (e.g. `?utm_source=...`) by requiring no `=` and no `&`.

## SMS link format
After this fix, either of these will work in SMS bodies and satisfy the DLT whitelist prefix `https://shraddha.hosla.in/blog?`:

- `https://shraddha.hosla.in/blog?gita-dhyanam-3be702` (shorter, what your operator is generating now)
- `https://shraddha.hosla.in/blog?slug=gita-dhyanam-3be702`

Both transparently redirect to `/blog/<slug>`.

## Out of scope
No changes to routing config, edge functions, sitemap, OG previews, or the `/blog/:slug` canonical path.

## Files touched
- `src/pages/Blog.tsx` — expand the query-param redirect (≈5 lines).

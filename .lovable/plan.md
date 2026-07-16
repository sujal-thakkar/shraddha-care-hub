# Elder-Friendly AI Blog + Newsletter Platform

Mobile-first story submission for 50–70+ authors, with Gemini-powered grammar assistant, Murf Falcon read-aloud, admin moderation, and DOCX newsletter export. Uses your own API keys (no Lovable AI credits consumed).

## Secrets to store

- `GEMINI_API_KEY` = `AQ.Ab8RN6...` (Google AI Studio — grammar suggestions, language detect)
- `MURF_API_KEY` = `ap2_f0e1...` (Murf Falcon — read-aloud TTS)

Stored via `set_secret` in Supabase Edge Function env. Never exposed to the browser.

## v1 Scope

1. Mobile-first story editor (title, body, cover image, bold/paragraph/bullet only)
2. Login required (Supabase auth: email/password + Google)
3. Gemini grammar/spelling suggestions on demand — accept/reject individually, never auto-rewrite
4. Auto-save drafts (debounced 5 s + on blur + on tab-hide)
5. Admin moderation workflow: draft → submitted → under_review → needs_changes → approved → published (+ admin_notes back to author)
6. Public `/blog` listing + `/blog/:slug` reader page (multilingual)
7. Admin newsletter builder: pick + drag-reorder blogs → export DOCX
8. Large-font accessibility toggle (18 / 22 / 26 px), persisted per user
9. Murf Falcon "Read aloud" button on reader page (streams MP3, auto-picks voice by detected language)

Deferred to v2 (UI placeholders reserved, no build now): voice-to-blog (STT), WhatsApp intake, PDF export, translation, headline suggestions, "writer's block" continuation, sentiment tagging.

## Elder-Friendly UX Principles

- One column. No toolbar clutter. Flow: Title → Story → Cover photo → Save draft / Submit.
- Only three formatting controls: **Bold**, • Bullet, ¶ Paragraph. No H1/H2/quotes/embeds/SEO/tags shown to author.
- Buttons ≥ 48 px, black-on-white, no gradients on the writer surface. High contrast.
- Reassuring progress card: "Title ✓ · Story ✓ · Photo optional · Ready to submit".
- Visible "Save draft" AND autosave with "Saved 2s ago" pill — user feels in control.
- Slug, tags, category, SEO — admin-only. Author never sees them.
- Font-size toggle persists in `profiles.preferred_font_size` + localStorage.

## Gemini Grammar Assistant (critical behavior)

- Edge Function `check-blog-writing` calls `gemini-2.5-flash` via Google AI Studio REST (`generativelanguage.googleapis.com/v1beta`), using `GEMINI_API_KEY`.
- Prompt strictly enforces: fix spelling + grammar + minor readability only; **preserve tone, emotion, storytelling style, and local expressions**; return corrected text in the SAME language the author wrote in; never sound AI-generated.
- Response shape (JSON mode): `{ language: "bn|hi|en|...", suggestions: [{ original, suggestion, reason, offsetStart, offsetEnd }] }`.
- UI shows "We found 8 improvements" with per-item Accept / Reject and Accept all. **Nothing is applied until the author accepts.** Author can submit without ever running AI — help, not a gate.
- Rate limit: 3 checks per user per minute (in-memory table `ai_check_log`), so a stuck user can't burn quota.

## Murf Falcon Read-Aloud

- Edge Function `read-blog-aloud` receives `{ blogId }`, loads body, calls `POST https://global.api.murf.ai/v1/speech/stream` with `model: "FALCON"`, `format: "MP3"`, `sampleRate: 24000`, `channelType: "MONO"`, and a voice/locale chosen from the blog's `language`:
  - `bn` → voiceId `hi-IN-ayushi` (falcon best-match — will confirm on first run) locale `bn-IN`
  - `hi` → `Aman`, locale `hi-IN`
  - `en` → `Gordon`, locale `en-US`
  - default → English fallback
- Response streamed straight back to the browser as `audio/mpeg`; reader page uses a plain `<audio>` element with big Play/Pause + speed 0.9× / 1× / 1.2×.
- Result cached in Supabase Storage bucket `blog-audio` keyed by `${blogId}-${contentHash}.mp3` so re-plays don't burn Murf credits. Regenerated when body changes.

## Database Schema

```
blogs
  id uuid pk
  author_id uuid → auth.users
  title text
  body text                       -- markdown-lite: **bold**, blank lines, "- " bullets
  cover_image_url text
  language text                   -- detected by Gemini or user pick
  status text                     -- draft|submitted|under_review|needs_changes|approved|published|archived
  admin_notes text
  slug text unique
  content_hash text               -- for TTS cache invalidation
  published_at timestamptz
  created_at, updated_at timestamptz

blog_ai_suggestions               -- audit trail (optional but cheap)
  id, blog_id, suggestions jsonb, created_at

newsletters
  id uuid pk
  title text
  issue_number int
  status text                     -- draft|exported
  created_by uuid, created_at, updated_at

newsletter_blogs                  -- ordered join
  newsletter_id, blog_id, position int
  primary key (newsletter_id, blog_id)

ai_check_log                      -- rate limiter for /check-blog-writing
  user_id, created_at
```

Column added to `profiles`: `preferred_font_size int default 18`.

Storage buckets: `blog-covers` (public), `blog-audio` (public, cache).

RLS (with GRANTs in the same migration):
- `blogs`: author can SELECT/INSERT/UPDATE/DELETE own rows only while `status IN ('draft','submitted','needs_changes')`; `anon` + `authenticated` SELECT rows where `status = 'published'`; admins full access via `is_admin()`.
- `newsletters` / `newsletter_blogs`: admin-only.
- `ai_check_log`: user can insert/select own, admin all.

## Routes

Public:
- `/blog` — published listing, search, language filter
- `/blog/:slug` — reader (font-toggle + Read aloud)
- `/blog/write` — editor (requires login)
- `/blog/my-stories` — author's drafts + status + admin notes

Admin (nested in `/admin/dashboard`):
- `/admin/dashboard/blogs` — moderation queue with status filters, inline edit, publish, note-back-to-author
- `/admin/dashboard/newsletters` — build, drag-reorder (`@dnd-kit`), export DOCX

Header nav: add "Stories".

## Editor Component

- Plain `<textarea>` based (no TipTap in v1). Lighter on old phones, zero learning curve. Three toolbar buttons: **B**, • bullet, ¶ paragraph — insert the tokens into the text.
- Autosave: debounce 5 s + on blur + on `visibilitychange`. Status pill: "Saving… / Saved 2s ago / Error — retrying".
- "Check my writing" button → calls edge function → renders suggestion list with per-item Accept/Reject.
- Cover image via existing `use-image-upload` hook, bucket `blog-covers` (already-compressed ≤1 MB / 1200 px).
- Font-size toggle (A · A+ · A++) top-right on editor AND reader.
- Reserved but disabled: `🎤 Speak instead` button (tooltip "Coming soon") so v2 slots in without redesign.

## Edge Functions

1. **`check-blog-writing`** — validates rate-limit + Zod body, calls Gemini `generateContent` with the preservation prompt, returns structured suggestions. `GEMINI_API_KEY` server-side.
2. **`publish-blog`** (admin-guarded via `is_admin()`) — flips status, generates slug (transliterate + `-<id6>` fallback for Bengali/Hindi), sets `published_at`, notifies author via existing `send-notification` Resend flow.
3. **`read-blog-aloud`** — checks `blog-audio` cache by `content_hash`; on miss, streams from Murf and mirrors bytes to Storage + response. Falls back gracefully if Murf 402/403.
4. **`generate-newsletter-docx`** (admin-guarded) — reads a newsletter + ordered blogs, generates DOCX with the format below using `docx` npm lib (via Deno `npm:docx`), returns as attachment download.

All edge functions: CORS via `npm:@supabase/supabase-js@2/cors`, Zod input validation, structured error responses.

## DOCX Export Spec (v1)

Per your note: **no cover page, no blog thumbnails** — you'll design the cover yourself.

Per-blog section:
- Blog title (24 pt bold, primary sage green `#0A8F6B`)
- "By {author name} · {published date, DD Month YYYY}" — 11 pt italic secondary grey
- Blank line
- Body paragraphs — 12 pt, 1.4 line height, justified; markdown-lite parsed into runs (bold), Paragraph nodes, and `LevelFormat.BULLET` lists
- Page break between blogs
- From blog 2 onward: header = newsletter title, right-aligned
- Footer: page number, centered

US Letter (12240×15840 DXA), 1" margins. Font: Calibri (universally rendered — Work Sans falls back cleanly). Follows DOCX skill rules: no `\n` inside runs, `PageBreak` in a Paragraph, `LevelFormat.BULLET` for lists, no tables used.

## Notifications

Piggyback existing `send-notification` + `notification_emails` table:
- Author gets email on: submission received, needs changes (with `admin_notes`), approved & published.
- Admin routing gets notified on new submissions (existing pattern).

## Performance & Scalability

- Blog list paginated with `.range()` + index on `(status, published_at desc)`, index on `language`.
- Cover images ≤ 1 MB / 1200 px via existing compression hook.
- Gemini call only on button press (never per keystroke) — cost bounded by rate limit.
- Murf audio cached in Storage by content hash — repeat plays = free.
- Body stored as markdown-lite text (single source of truth) → renders to reader HTML, DOCX, and future PDF/HTML email from the same field.
- Slug generation server-side with unicode-safe transliteration + `-<id6>` fallback.

## Non-goals (v2 backlog, not built now)

Voice-to-blog (STT), WhatsApp intake, PDF export, translation between languages, headline generator, sentiment/category auto-tagging, in-app comment threads. UI placeholders exist so v2 doesn't require redesign.

## Build Order

1. Migration: 3 tables + `profiles.preferred_font_size` + 2 buckets + RLS + GRANTs
2. Store `GEMINI_API_KEY` and `MURF_API_KEY` via `set_secret`
3. Public listing + reader page (works before AI is wired)
4. Editor + autosave + cover upload + my-stories
5. `check-blog-writing` edge function + suggestion UI
6. Admin blogs moderation page + `publish-blog` function + Resend notifications
7. `read-blog-aloud` edge function + reader Play/Pause + storage cache
8. Admin newsletters page + `@dnd-kit` reorder + `generate-newsletter-docx`
9. Header nav "Stories", font-size toggle everywhere, docs update in `DOCUMENTATION.md`

If this looks right, I'll implement in this order and test each stage (edge functions via `curl_edge_functions`, UI via preview).

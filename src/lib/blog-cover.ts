// Central fallback cover image used when a blog was submitted without one.
import defaultCover from "@/assets/default-blog-cover.jpg.asset.json";

export const DEFAULT_BLOG_COVER_URL = defaultCover.url;

/** Returns the blog's cover if set, otherwise the shared default. */
export function coverImageOrDefault(url: string | null | undefined): string {
  return url && url.trim() ? url : DEFAULT_BLOG_COVER_URL;
}

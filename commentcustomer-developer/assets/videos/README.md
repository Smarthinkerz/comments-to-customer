# Demo Videos

These video files are excluded from git (each ~70MB; GitHub rejects single files >100MB and warns at >50MB).

## Files referenced by the theme
- `ai-replies-demo.mp4` — used by `template-parts/sections/demo-section-2.php` (Product Demo)
- `realtime-lead-demo.mp4` — used by `template-parts/sections/demo-section-1.php` (See It In Action)

## How to wire them up in production
1. Upload both `.mp4` files to a CDN: Cloudflare R2, AWS S3 + CloudFront, Bunny.net, or similar.
2. Either:
   - **Option A (simplest)** — replace the relative `<source src="...">` paths in the two PHP templates with the absolute CDN URLs.
   - **Option B (configurable)** — add a `CC_VIDEO_BASE_URL` env var on the server, expose it to templates, and prefix the `src` values with it.
3. Local dev copies of these files remain in this folder on disk (gitignored) — nothing is broken locally.

## Why excluded
- Total size ~143 MB → would inflate every clone of the repo.
- GitHub hard-limits single files at 100 MB; even Git LFS adds bandwidth limits on Vercel's free tier.
- Videos rarely change — a CDN URL is the right long-term home.

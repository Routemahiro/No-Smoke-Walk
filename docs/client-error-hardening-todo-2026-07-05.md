# Client-side Application Error Hardening TODO

Date: 2026-07-05

Goal: reduce intermittent production "Application error" failures, collect enough evidence to identify the root cause, and deploy the hardening to production through GitHub Actions.

## Checklist

- [x] P0-1: Guard unprotected `localStorage` reads/writes in `ReportForm` and `useGeolocation`.
- [x] P0-2: Guard `HeatmapView` MapLibre initialization and show a fallback message when map rendering is unavailable.
- [x] P1-1: Add privacy-safe client exception reporting for `error` and `unhandledrejection` events.
- [x] P1-2: Add a user-facing global error fallback page with a reload action.
- [x] P2-1: Add one-time recovery for chunk-load style errors.
- [x] P2-2: Stop `MiniHeatmap` from recreating the MapLibre map on every user-location update.
- [x] P2-3: Ensure Cloudflare Pages `_headers` is deployed from the static output.
- [x] Verify: run frontend typecheck, lint, tests, and production build.
- [x] Deploy: commit and push to `main`, then confirm GitHub Actions `Deploy to Cloudflare` succeeds.

## Notes

- Do not send location coordinates, report contents, or personal data in client exception reporting.
- Deploy must go through GitHub Actions. Do not run local `wrangler deploy`.
- Keep unrelated existing worktree changes out of this commit.

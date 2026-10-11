---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** The preview serves the compiled Next.js export through Vite. Its original Next runtime is enabled on `/login` and `/owner`; other routes stay static. The account pages proxy API and Socket.IO traffic through the preview origin.

**Why:** The full project export includes the original compiled login/dashboard runtime. The earlier static login replacement did not match the source app's auth navigation.

**How to apply:** Keep the actual Next bundles on `/login` and `/owner`, with same-origin `/v2` and `/ws` proxying in preview. Do not inject the static login helper on those routes. React hydration #421 and Vercel analytics 404s have appeared in browser logs; the signed-in flow still needs user verification.

**Owner dashboard presentation:** For owner-only visual changes, attach route-scoped assets to the packaged `/owner` export until the original Next pages are connected to the active preview.

**Why:** The Vite preview serves compiled Next pages, so edits to the disconnected React source do not reach the running owner dashboard. The owner-only scope also keeps login, backend contracts, and other pages unchanged.

**How to apply:** Limit enhancements to `/owner`, preserve existing DOM callbacks and data flows, and verify both the served route and production-export injection. Prefer connecting the source pages before broad future redesigns.

**Persistent owner navigation:** Keep the owner sidebar visible as an icon-only rail when collapsed, including on narrow screens; hovering or focusing expands it, and the hamburger toggles its width instead of hiding it.

**Why:** The user explicitly wants navigation icons to remain available after closing the full sidebar.

**How to apply:** Keep icons visible when collapsed and let main content fill the space beside the rail; on mobile, keep only the owner sidebar's drawer visible and suppress its own backdrop. Do not hide modal or dialog backdrops.

**Hamburger and hover interaction:** Do not use `:hover` on the full-height desktop rail to expand it; gate hover expansion to pointer movement below the fixed app bar, while keeping keyboard focus expansion.

**Why:** The hamburger occupies the rail's left-side area; broad hover expansion can immediately reopen a rail when the user clicks to collapse it.

**How to apply:** Control collapsed hover expansion with an explicit state class driven by pointer position below the app bar, and clear it when the hamburger is clicked or the pointer leaves the rail.

**Production login confirmation:** The user confirmed on October 11, 2026 that valid username/password login works on `xoftware.id`; this does not establish that the Replit preview's owner dashboard is functional.

**Why:** Production authentication and the Replit preview use different origins and routing.

**How to apply:** When preview login succeeds but `/owner` does not open, check cookie persistence, the `/v2/owner/auth/check` response, and the `/ws` connection before blaming the credentials.

**Owner preview scope:** The user wants `/owner` to run from this project/local preview, not redirect to the production domain.

**Why:** This is an explicit requirement for the imported Xoftware project.

**How to apply:** Keep the owner runtime and its backend API/WebSocket connections usable through the Replit preview; treat `xoftware.id` as production, not as the default dashboard target.

**Preview server note:** Keep the artifact's declared `localPort` and service `PORT` aligned on a port supported by Replit. This static-export preview also runs more reliably without React/Tailwind processing and Replit-only development plugins; enabling those plugins caused the Vite process to exhaust its Node heap in the preview environment.

**Why:** The imported artifact initially declared an unsupported high port, then Vite started but ran out of memory with the full development plugin set. A supported port and a lightweight static-preview plugin set brought the workflow up.

**How to apply:** When changing preview setup, check the supported managed-workflow ports and preserve the lean Vite dev configuration. Keep the Vite React/Tailwind plugins off in development; the packaged Next bundles already contain the page runtime.

**Preview CAPTCHA note:** The official-domain Turnstile key throws uncaught Cloudflare error 110200 on local and Replit preview hosts.

**Why:** Cloudflare validates the widget's allowed hostname, and this error is surfaced by Replit's runtime overlay as an artifact crash.

**How to apply:** Load the production widget only on `xoftware.id` and its subdomains; show a clear preview notice elsewhere. Do not substitute a public test key for a production API verification flow.

**Owner onboarding behavior:** Keep the dashboard tour user-initiated rather than opening it automatically after sign-in. The packaged `/owner` runtime's tour opens and closes the mobile drawer across steps and blocks direct clicks while active.

**Why:** First-time sessions can appear to have a flickering sidebar that cannot be controlled while the guided overlay is running.

**How to apply:** In the packaged preview, set the tour-seen flag before the Next runtime hydrates; retain the existing help button so the user can replay the tour. When the source pages become active, keep their tour manual as well.

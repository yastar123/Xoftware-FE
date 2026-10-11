---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** The preview serves the compiled Next.js export through Vite. Its original Next runtime is enabled on `/login` and `/owner`; other routes stay static. The account pages proxy API and Socket.IO traffic through the preview origin.

**Why:** The full project export includes the original compiled login/dashboard runtime. The earlier static login replacement did not match the source app's auth navigation.

**How to apply:** Keep the actual Next bundles on `/login` and `/owner`, with same-origin `/v2` and `/ws` proxying in preview. Do not inject the static login helper on those routes. React hydration #421 and Vercel analytics 404s have appeared in browser logs; the signed-in flow still needs user verification.

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

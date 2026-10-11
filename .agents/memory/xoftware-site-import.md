---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** Loading the archived Next.js runtime alongside Vite caused React error #421 (a Suspense update before hydration completed) and requests for Vercel analytics endpoints. The current preview removes those scripts and exposes the server-rendered motion content.

**How to apply:** Treat the preview as server-rendered HTML. Restore only needed interactions with focused scripts and explicit Vite preview routes instead of re-enabling the old Next runtime. Login now has client-side steps, password reset and 2FA flows that call the existing API through restricted dev proxy routes; registration and owner-dashboard interactions still need verification.

**Production login confirmation:** The user confirmed on October 11, 2026 that valid username/password login works on `xoftware.id`; this does not establish that the Replit preview's owner dashboard is functional.

**Why:** The preview's `/owner` route currently receives only its static loading shell because the archived Next.js runtime is omitted there.

**How to apply:** When `/owner` hangs in preview, focus diagnosis on dashboard runtime/hydration and preview routing, not on the user's credentials.

**Preview server note:** Keep the artifact's declared `localPort` and service `PORT` aligned on a port supported by Replit. This static-export preview also runs more reliably without React/Tailwind processing and Replit-only development plugins; enabling those plugins caused the Vite process to exhaust its Node heap in the preview environment.

**Why:** The imported artifact initially declared an unsupported high port, then Vite started but ran out of memory with the full development plugin set. A supported port and a lightweight static-preview plugin set brought the workflow up.

**How to apply:** When changing preview setup, check the supported managed-workflow ports and preserve the lean Vite dev configuration. Keep framework plugins for production builds if needed; do not re-enable the archived Next runtime.

**Preview CAPTCHA note:** The official-domain Turnstile key throws uncaught Cloudflare error 110200 on local and Replit preview hosts.

**Why:** Cloudflare validates the widget's allowed hostname, and this error is surfaced by Replit's runtime overlay as an artifact crash.

**How to apply:** Load the production widget only on `xoftware.id` and its subdomains; show a clear preview notice elsewhere. Do not substitute a public test key for a production API verification flow.

---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** Loading the archived Next.js runtime alongside Vite caused React error #421 (a Suspense update before hydration completed) and requests for Vercel analytics endpoints. The current preview removes those scripts and exposes the server-rendered motion content.

**How to apply:** Treat the preview as server-rendered HTML. Restore only needed interactions with focused scripts and explicit Vite preview routes instead of re-enabling the old Next runtime. Login now has client-side steps, password reset and 2FA flows that call the existing API through restricted dev proxy routes; registration and owner-dashboard interactions still need verification.

**Preview CAPTCHA note:** The official-domain Turnstile key throws uncaught Cloudflare error 110200 on local and Replit preview hosts.

**Why:** Cloudflare validates the widget's allowed hostname, and this error is surfaced by Replit's runtime overlay as an artifact crash.

**How to apply:** Load the production widget only on `xoftware.id` and its subdomains; show a clear preview notice elsewhere. Do not substitute a public test key for a production API verification flow.

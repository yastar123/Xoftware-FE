---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** Loading the archived Next.js runtime alongside Vite caused React error #421 (a Suspense update before hydration completed) and requests for Vercel analytics endpoints. The current preview removes those scripts and exposes the server-rendered motion content.

**How to apply:** Treat the current preview as a static snapshot. FAQ search/accordion behavior, app routing, and API-backed actions still require reconnecting the original page source to a compatible runtime; these were not verified by serving the static export.

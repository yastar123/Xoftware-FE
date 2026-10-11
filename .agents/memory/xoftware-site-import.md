---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**Operational note:** Loading the archived Next.js runtime alongside Vite caused React error #421 (a Suspense update before hydration completed) and requests for Vercel analytics endpoints. The current preview removes those scripts and exposes the server-rendered motion content.

**How to apply:** Treat the preview as server-rendered static HTML. `public/static-navigation.js` restores the landing-page menu, section links, FAQ search/accordion, and key CTAs; Vite middleware maps exported `.html` pages to friendly preview routes. Login/register page submission and API-backed actions still need the original app runtime and backend.

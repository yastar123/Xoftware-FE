---
name: Imported Xoftware site
description: Why the uploaded Xoftware website currently previews from its packaged static export.
---

The uploaded project includes a Vite artifact whose entry route is a scaffold placeholder, while the original pages still depend on Next.js modules and are not connected to that Vite entry. Its ZIP includes a compiled static export that can be served as the existing site without a framework migration.

**Why:** The request was to run the existing website, not to rebuild its frontend or migrate routing and framework integrations.

**How to apply:** For future requests to change or restore the interactive app, treat the current static preview as a snapshot and first decide how to reconnect the original page source to the app runtime. Backend-dependent actions were not verified by serving the static export.

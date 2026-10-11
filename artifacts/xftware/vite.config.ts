import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const staticExportCompatibility = {
  name: 'xoftware-static-export-compatibility',
  transformIndexHtml(html: string) {
    const staticHtml = html
      .replace(
        /<script\b(?=[^>]*\bsrc=["']\/_next\/static\/)[^>]*><\/script>/g,
        '',
      )
      .replace(
        /<script\b(?=[^>]*\bid=["']__NEXT_DATA__["'])[^>]*>[\s\S]*?<\/script>/g,
        '',
      );

    return staticHtml.replace(
      '</head>',
      `<style>
        #__next [style*="opacity:0"][style*="transform"],
        #__next [style*="opacity: 0"][style*="transform"] {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
      </style></head>`,
    );
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    staticExportCompatibility,
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

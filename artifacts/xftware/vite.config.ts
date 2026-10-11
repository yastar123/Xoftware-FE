import path from 'path';
import { readFile } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

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

const publicRoot = path.resolve(import.meta.dirname, 'public');

const staticExportCompatibility: Plugin = {
  name: 'xoftware-static-export-compatibility',

  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();

      let pathname: string;
      try {
        pathname = decodeURIComponent(
          new URL(req.url ?? '/', 'http://localhost').pathname,
        );
      } catch {
        return next();
      }

      if (
        pathname === '/' ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/_next/')
      ) {
        return next();
      }

      const route = pathname.replace(/^\/+|\/+$/g, '').replace(/\.html?$/i, '');
      if (!route || (path.extname(route) && !pathname.endsWith('.html'))) {
        return next();
      }

      const candidates = [`${route}.html`, path.join(route, 'index.html')];
      if (route.startsWith('docs/')) candidates.push('docs.html');

      let html: string | undefined;
      try {
        for (const candidate of candidates) {
          const filePath = path.resolve(publicRoot, candidate);
          if (!filePath.startsWith(`${publicRoot}${path.sep}`)) continue;

          try {
            html = await readFile(filePath, 'utf8');
            break;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              return next(error as Error);
            }
          }
        }

        if (!html) {
          html = await readFile(path.join(publicRoot, '404.html'), 'utf8');
          res.statusCode = 404;
        }

        const transformed = await server.transformIndexHtml(req.url ?? '/', html);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(req.method === 'HEAD' ? '' : transformed);
      } catch (error) {
        next(error as Error);
      }
    });
  },

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

    return staticHtml
      .replace(
      '</head>',
      `<style>
        #__next [style*="opacity:0"][style*="transform"],
        #__next [style*="opacity: 0"][style*="transform"] {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
      </style></head>`,
      )
      .replace(
        '</body>',
        '<script src="/static-navigation.js" defer></script><script src="/static-login.js" defer></script></body>',
      );
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    staticExportCompatibility,
    ...(process.env.NODE_ENV === 'production' ? [react(), tailwindcss()] : []),
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
    proxy: {
      '/__xoftware_api/owner/auth/login': {
        target: 'https://backend-s2.xoftware.id',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace('/__xoftware_api', '/v2'),
      },
      '/__xoftware_api/owner/auth/forgot-password/request': {
        target: 'https://backend-s2.xoftware.id',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace('/__xoftware_api', '/v2'),
      },
      '/__xoftware_api/owner/auth/forgot-password/action': {
        target: 'https://backend-s2.xoftware.id',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace('/__xoftware_api', '/v2'),
      },
    },
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

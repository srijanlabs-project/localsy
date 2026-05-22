import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  // Safe default: dynamic PORT for Railway/production environment, falling back to 3000 for local development in AI Studio
  const PORT = Number(process.env.PORT || 3000);

  // Request logger middleware to help debug incoming traffic
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // Health check API endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  // Robust check: if dist exists, we serve static files (production), otherwise we use Vite middleware
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distPath);

  // Vite middleware setup based on environment
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from /dist
    app.use(express.static(distPath));
    // Fallback to index.html for Single-Page Application (SPA) routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Omit '0.0.0.0' to listen on IPv4 + IPv6 dual-stack as required by some Railway regions
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (IPv4 and IPv6 dual-stack supported)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

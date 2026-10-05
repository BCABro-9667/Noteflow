import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/auth.js';
import { notesRouter } from './server/routes/notes.js';
import { tagsRouter } from './server/routes/tags.js';
import { getDb } from './server/db.js';
import { connectMongo, getMongoStatus } from './server/mongo.js';
import { memoryCache } from './server/cache.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Initialize Relational / Local Database
  try {
    await getDb();
    console.log('[Database] Relational storage initialized successfully.');
  } catch (dbErr) {
    console.error('[Database] Initialization error:', dbErr);
  }

  // Connect to MongoDB if MONGODB_URI is provided
  try {
    await connectMongo();
  } catch (mongoErr) {
    console.warn('[MongoDB] Non-blocking connect warning:', mongoErr);
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'NoteFlow', timestamp: new Date().toISOString() });
  });

  // System & Database Status
  app.get('/api/system/status', async (_req, res) => {
    try {
      const mongo = await getMongoStatus();
      const cache = memoryCache.getStats();
      res.json({
        status: 'ok',
        app: 'NoteFlow',
        mongo,
        cache,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve system status' });
    }
  });

  app.post('/api/system/flush-cache', (_req, res) => {
    memoryCache.flush();
    res.json({ message: 'In-memory cache flushed successfully.', cache: memoryCache.getStats() });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/tags', tagsRouter);

  // Vite middleware in dev, static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NoteFlow Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

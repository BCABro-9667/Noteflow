import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb, persistDb } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { memoryCache } from '../cache.js';
import { syncTagToMongo, deleteTagFromMongo } from '../mongo.js';

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

// Get all tags for user with note counts
tagsRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `tags:${userId}`;
    const cached = memoryCache.get<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ tags: cached });
      return;
    }

    const db = await getDb();

    const result = await db.query<{
      id: string;
      name: string;
      color: string;
      created_at: string;
      note_count: string;
    }>(
      `SELECT
        t.id,
        t.name,
        t.color,
        t.created_at,
        COUNT(nt.note_id)::text as note_count
      FROM tags t
      LEFT JOIN note_tags nt ON nt.tag_id = t.id
      LEFT JOIN notes n ON n.id = nt.note_id AND n.deleted_at IS NULL
      WHERE t.user_id = $1
      GROUP BY t.id, t.name, t.color, t.created_at
      ORDER BY t.name ASC`,
      [userId]
    );

    const tags = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      noteCount: parseInt(row.note_count, 10) || 0,
    }));

    memoryCache.set(cacheKey, tags, 60);
    res.setHeader('X-Cache', 'MISS');
    res.json({ tags });
  } catch (err) {
    console.error('Fetch tags error:', err);
    res.status(500).json({ error: 'Failed to retrieve tags.' });
  }
});

// Create tag
tagsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, color = '#2563eb' } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Tag name is required.' });
      return;
    }

    const trimmedName = name.trim();
    const db = await getDb();

    // Check duplicate
    const existing = await db.query(
      'SELECT id FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, trimmedName]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'A tag with this name already exists.' });
      return;
    }

    const tagId = crypto.randomUUID();
    await db.query(
      'INSERT INTO tags (id, user_id, name, color, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [tagId, userId, trimmedName, color]
    );

    persistDb(db);
    memoryCache.del(`tags:${userId}`);
    memoryCache.delPattern(`notes:list:${userId}`);
    syncTagToMongo({ id: tagId, user_id: userId, name: trimmedName, color });

    res.status(201).json({
      tag: {
        id: tagId,
        name: trimmedName,
        color,
        noteCount: 0,
      },
    });
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Failed to create tag.' });
  }
});

// Rename / update tag
tagsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tagId = req.params.id;
    const { name, color } = req.body;

    const db = await getDb();

    const existing = await db.query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [tagId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Tag not found.' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [tagId, userId];
    let pIdx = 3;

    if (name && typeof name === 'string' && name.trim()) {
      // Check duplicate
      const duplicate = await db.query(
        'SELECT id FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [userId, name.trim(), tagId]
      );
      if (duplicate.rows.length > 0) {
        res.status(400).json({ error: 'A tag with this name already exists.' });
        return;
      }
      updates.push(`name = $${pIdx}`);
      params.push(name.trim());
      pIdx++;
    }

    if (color && typeof color === 'string') {
      updates.push(`color = $${pIdx}`);
      params.push(color);
      pIdx++;
    }

    if (updates.length > 0) {
      await db.query(`UPDATE tags SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`, params);
    }

    const updated = await db.query<{ id: string; name: string; color: string }>(
      'SELECT id, name, color FROM tags WHERE id = $1',
      [tagId]
    );

    persistDb(db);
    memoryCache.del(`tags:${userId}`);
    memoryCache.delPattern(`notes:list:${userId}`);
    syncTagToMongo(updated.rows[0]);

    res.json({ tag: updated.rows[0] });
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(500).json({ error: 'Failed to update tag.' });
  }
});

// Delete tag
tagsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tagId = req.params.id;
    const db = await getDb();

    const result = await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id', [tagId, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tag not found.' });
      return;
    }

    persistDb(db);
    memoryCache.del(`tags:${userId}`);
    memoryCache.delPattern(`notes:list:${userId}`);
    deleteTagFromMongo(tagId);

    res.json({ message: 'Tag deleted successfully.', id: tagId });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Failed to delete tag.' });
  }
});

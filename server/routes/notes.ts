import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb, persistDb } from '../db.js';
import { requireAuth, AuthenticatedRequest, comparePassword } from '../auth.js';
import { memoryCache } from '../cache.js';
import { syncNoteToMongo, deleteNoteFromMongo } from '../mongo.js';

export const notesRouter = Router();

notesRouter.use(requireAuth);

interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_locked: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags_json?: string;
}

// Get all notes with filtering, searching, and sorting
notesRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { filter = 'all', tag, search, sort = 'updated_desc' } = req.query;

    const cacheKey = `notes:list:${userId}:${filter}:${tag || ''}:${search || ''}:${sort}`;
    const cachedData = memoryCache.get<{ notes: any[]; count: number }>(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cachedData);
      return;
    }

    const db = await getDb();

    let queryConditions: string[] = ['n.user_id = $1'];
    let params: any[] = [userId];
    let paramIndex = 2;

    // Filter condition
    if (filter === 'trash') {
      queryConditions.push('n.deleted_at IS NOT NULL');
    } else {
      queryConditions.push('n.deleted_at IS NULL');
      if (filter === 'archived') {
        queryConditions.push('n.is_archived = TRUE');
      } else if (filter === 'favorites') {
        queryConditions.push('n.is_archived = FALSE AND n.is_favorite = TRUE');
      } else if (filter === 'pinned') {
        queryConditions.push('n.is_archived = FALSE AND n.is_pinned = TRUE');
      } else {
        // 'all'
        queryConditions.push('n.is_archived = FALSE');
      }
    }

    // Tag filter
    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      queryConditions.push(`EXISTS (
        SELECT 1 FROM note_tags nt WHERE nt.note_id = n.id AND nt.tag_id = $${paramIndex}
      )`);
      params.push(tag.trim());
      paramIndex++;
    }

    // Search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      queryConditions.push(`(
        n.title ILIKE $${paramIndex} OR
        n.content ILIKE $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM note_tags nt
          JOIN tags t ON nt.tag_id = t.id
          WHERE nt.note_id = n.id AND t.name ILIKE $${paramIndex}
        )
      )`);
      params.push(searchPattern);
      paramIndex++;
    }

    // Sorting
    let orderByClause = '';
    switch (sort) {
      case 'created_desc':
        orderByClause = 'n.is_pinned DESC, n.created_at DESC';
        break;
      case 'created_asc':
        orderByClause = 'n.is_pinned DESC, n.created_at ASC';
        break;
      case 'title_asc':
        orderByClause = 'n.is_pinned DESC, LOWER(n.title) ASC';
        break;
      case 'title_desc':
        orderByClause = 'n.is_pinned DESC, LOWER(n.title) DESC';
        break;
      case 'updated_desc':
      default:
        orderByClause = 'n.is_pinned DESC, n.updated_at DESC';
        break;
    }

    const sql = `
      SELECT
        n.id,
        n.user_id,
        n.title,
        n.content,
        n.is_pinned,
        n.is_favorite,
        n.is_archived,
        n.is_locked,
        n.deleted_at,
        n.created_at,
        n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE ${queryConditions.join(' AND ')}
      ORDER BY ${orderByClause}
    `;

    const result = await db.query<NoteRow & { tags: any }>(sql, params);

    const formattedNotes = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      isPinned: row.is_pinned,
      isFavorite: row.is_favorite,
      isArchived: row.is_archived,
      isLocked: Boolean(row.is_locked),
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
    }));

    const responsePayload = { notes: formattedNotes, count: formattedNotes.length };
    memoryCache.set(cacheKey, responsePayload, 60); // 1 minute TTL cache

    res.setHeader('X-Cache', 'MISS');
    res.json(responsePayload);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// Create note
notesRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title = '', content = '', isPinned = false, isFavorite = false, isArchived = false, isLocked = false, tags = [] } = req.body;

    const db = await getDb();
    const noteId = crypto.randomUUID();

    await db.query(
      `INSERT INTO notes (id, user_id, title, content, is_pinned, is_favorite, is_archived, is_locked, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [noteId, userId, title, content, Boolean(isPinned), Boolean(isFavorite), Boolean(isArchived), Boolean(isLocked)]
    );

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        // Verify tag belongs to user
        const tagCheck = await db.query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [tagId, userId]);
        if (tagCheck.rows.length > 0) {
          await db.query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [noteId, tagId]);
        }
      }
    }

    // Fetch created note with tags
    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    const row = result.rows[0];
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    syncNoteToMongo(row, Array.isArray(tags) ? tags : []);
    res.status(201).json({
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: Boolean(row.is_locked),
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// Empty trash (MUST be defined before /:id)
notesRouter.post('/empty-trash', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    const result = await db.query('DELETE FROM notes WHERE user_id = $1 AND deleted_at IS NOT NULL', [userId]);
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    res.json({ message: 'Trash emptied successfully.', count: result.rows.length });
  } catch (err) {
    console.error('Empty trash error:', err);
    res.status(500).json({ error: 'Failed to empty trash.' });
  }
});

// Get single note
notesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;

    const cacheKey = `notes:single:${userId}:${noteId}`;
    const cachedNote = memoryCache.get<any>(cacheKey);
    if (cachedNote) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ note: cachedNote });
      return;
    }

    const db = await getDb();

    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    const row = result.rows[0];
    const formattedSingleNote = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      isPinned: row.is_pinned,
      isFavorite: row.is_favorite,
      isArchived: row.is_archived,
      isLocked: Boolean(row.is_locked),
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
    };

    memoryCache.set(cacheKey, formattedSingleNote, 60);
    res.setHeader('X-Cache', 'MISS');
    res.json({ note: formattedSingleNote });
  } catch (err) {
    console.error('Get single note error:', err);
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
});

// Update note
notesRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const { title, content, isPinned, isFavorite, isArchived, isLocked, tags } = req.body;

    const db = await getDb();

    // Verify ownership
    const existing = await db.query('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Note not found or unauthorized.' });
      return;
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [noteId, userId];
    let pIdx = 3;

    if (title !== undefined) {
      updates.push(`title = $${pIdx}`);
      params.push(title);
      pIdx++;
    }
    if (content !== undefined) {
      updates.push(`content = $${pIdx}`);
      params.push(content);
      pIdx++;
    }
    if (isPinned !== undefined) {
      updates.push(`is_pinned = $${pIdx}`);
      params.push(Boolean(isPinned));
      pIdx++;
    }
    if (isFavorite !== undefined) {
      updates.push(`is_favorite = $${pIdx}`);
      params.push(Boolean(isFavorite));
      pIdx++;
    }
    if (isArchived !== undefined) {
      updates.push(`is_archived = $${pIdx}`);
      params.push(Boolean(isArchived));
      pIdx++;
    }
    if (isLocked !== undefined) {
      updates.push(`is_locked = $${pIdx}`);
      params.push(Boolean(isLocked));
      pIdx++;
    }

    await db.query(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`,
      params
    );

    // Update tags if provided
    if (Array.isArray(tags)) {
      await db.query('DELETE FROM note_tags WHERE note_id = $1', [noteId]);
      for (const tagId of tags) {
        const tagCheck = await db.query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [tagId, userId]);
        if (tagCheck.rows.length > 0) {
          await db.query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [noteId, tagId]);
        }
      }
    }

    // Fetch updated note
    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    const row = result.rows[0];
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);
    syncNoteToMongo(row, Array.isArray(tags) ? tags : []);
    res.json({
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: Boolean(row.is_locked),
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// Lock a note
notesRouter.post('/:id/lock', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = await getDb();

    const existing = await db.query('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    await db.query('UPDATE notes SET is_locked = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2', [noteId, userId]);
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);

    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    const row = result.rows[0];
    res.json({
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: true,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err: any) {
    console.error('Lock note error:', err);
    res.status(500).json({ error: 'Failed to lock note' });
  }
});

// Unlock a note permanently
notesRouter.post('/:id/unlock', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string') {
      res.status(400).json({ error: 'PIN is required to unlock this note.' });
      return;
    }

    const db = await getDb();
    const userRes = await db.query<{ pin_hash: string | null }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0 || !userRes.rows[0].pin_hash) {
      res.status(400).json({ error: 'No PIN is configured on your account.' });
      return;
    }

    const isValid = await comparePassword(pin, userRes.rows[0].pin_hash);
    if (!isValid) {
      res.status(400).json({ error: 'Incorrect PIN. Note remains locked.' });
      return;
    }

    await db.query('UPDATE notes SET is_locked = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2', [noteId, userId]);
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);

    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    const row = result.rows[0];
    res.json({
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: false,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err: any) {
    console.error('Unlock note error:', err);
    res.status(500).json({ error: 'Failed to unlock note' });
  }
});

// Verify PIN to access / view a locked note
notesRouter.post('/:id/verify-pin', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string') {
      res.status(400).json({ valid: false, error: 'PIN is required.' });
      return;
    }

    const db = await getDb();
    const userRes = await db.query<{ pin_hash: string | null }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0 || !userRes.rows[0].pin_hash) {
      res.status(400).json({ valid: false, error: 'No PIN is configured on your account.' });
      return;
    }

    const isValid = await comparePassword(pin, userRes.rows[0].pin_hash);
    if (!isValid) {
      res.status(400).json({ valid: false, error: 'Incorrect PIN. Please try again.' });
      return;
    }

    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ valid: false, error: 'Note not found.' });
      return;
    }

    const row = result.rows[0];
    res.json({
      valid: true,
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: Boolean(row.is_locked),
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err: any) {
    console.error('Verify note PIN error:', err);
    res.status(500).json({ valid: false, error: 'Failed to verify note PIN' });
  }
});
notesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = await getDb();

    const result = await db.query(
      'UPDATE notes SET deleted_at = NOW(), is_pinned = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);
    syncNoteToMongo({ id: noteId, user_id: userId, deleted_at: new Date(), is_pinned: false });
    res.json({ message: 'Note moved to trash.', id: noteId });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to move note to trash.' });
  }
});

// Restore note from Trash
notesRouter.post('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = await getDb();

    const result = await db.query(
      'UPDATE notes SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found in trash.' });
      return;
    }

    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);
    syncNoteToMongo({ id: noteId, user_id: userId, deleted_at: null });
    res.json({ message: 'Note restored successfully.', id: noteId });
  } catch (err) {
    console.error('Restore note error:', err);
    res.status(500).json({ error: 'Failed to restore note.' });
  }
});

// Permanent delete
notesRouter.delete('/:id/permanent', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = await getDb();

    const result = await db.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    memoryCache.del(`notes:single:${userId}:${noteId}`);
    deleteNoteFromMongo(noteId);
    res.json({ message: 'Note permanently deleted.', id: noteId });
  } catch (err) {
    console.error('Permanent delete note error:', err);
    res.status(500).json({ error: 'Failed to permanently delete note.' });
  }
});

// Duplicate note
notesRouter.post('/:id/duplicate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = await getDb();

    const original = await db.query<any>(
      'SELECT title, content, is_favorite FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (original.rows.length === 0) {
      res.status(404).json({ error: 'Original note not found.' });
      return;
    }

    const orig = original.rows[0];
    const newNoteId = crypto.randomUUID();
    const newTitle = orig.title ? `${orig.title} (Copy)` : 'Untitled Note (Copy)';

    await db.query(
      `INSERT INTO notes (id, user_id, title, content, is_pinned, is_favorite, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, FALSE, $5, FALSE, NOW(), NOW())`,
      [newNoteId, userId, newTitle, orig.content, orig.is_favorite]
    );

    // Duplicate tags
    const origTags = await db.query<{ tag_id: string }>(
      'SELECT tag_id FROM note_tags WHERE note_id = $1',
      [noteId]
    );

    for (const t of origTags.rows) {
      await db.query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)', [newNoteId, t.tag_id]);
    }

    // Fetch duplicated note
    const result = await db.query<any>(
      `SELECT
        n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked, n.deleted_at, n.created_at, n.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM note_tags nt
            JOIN tags t ON nt.tag_id = t.id
            WHERE nt.note_id = n.id
          ),
          '[]'::json
        ) as tags
      FROM notes n
      WHERE n.id = $1 AND n.user_id = $2`,
      [newNoteId, userId]
    );

    const row = result.rows[0];
    persistDb(db);
    memoryCache.delPattern(`notes:list:${userId}`);
    syncNoteToMongo(row, origTags.rows.map((t) => t.tag_id));
    res.status(201).json({
      note: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        isPinned: row.is_pinned,
        isFavorite: row.is_favorite,
        isArchived: row.is_archived,
        isLocked: Boolean(row.is_locked),
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      },
    });
  } catch (err) {
    console.error('Duplicate note error:', err);
    res.status(500).json({ error: 'Failed to duplicate note.' });
  }
});

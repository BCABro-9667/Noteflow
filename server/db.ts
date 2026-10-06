import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'noteflow_store.json');

export async function getDb(): Promise<PGlite> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!initPromise) {
    initPromise = initDatabase();
  }
  return initPromise;
}

async function initDatabase(): Promise<PGlite> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const instance = new PGlite();
  await instance.waitReady;

  await initSchema(instance);
  await loadOrSeedData(instance);

  dbInstance = instance;
  return instance;
}

async function initSchema(db: PGlite) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      dob TEXT,
      address TEXT,
      bio TEXT,
      pin_hash TEXT,
      reset_token TEXT,
      reset_token_expires BIGINT,
      token_version INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

    -- Clean up any empty notes
    DELETE FROM notes WHERE (title IS NULL OR TRIM(title) = '') AND (content IS NULL OR TRIM(REGEXP_REPLACE(content, '<[^>]*>', '', 'g')) = '');

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_tag UNIQUE (user_id, name)
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_notes_user_flags ON notes(user_id, deleted_at, is_archived, is_pinned);
    CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);
  `);
}

export async function seedDemoUser(db: PGlite): Promise<string> {
  const demoEmail = 'alex.demo@noteflow.app';
  const existing = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [demoEmail]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const userId = '00000000-0000-0000-0000-000000000001';
  const userName = 'Alex Morgan';
  const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const hashedPassword = await bcrypt.hash('DemoPassword123!', 10);

  await db.query(
    `INSERT INTO users (id, name, email, password, avatar, token_version)
     VALUES ($1, $2, $3, $4, $5, 1)
     ON CONFLICT (id) DO NOTHING`,
    [userId, userName, demoEmail, hashedPassword, avatarUrl]
  );

  const tagsToCreate = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Work', color: '#2563eb' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Personal', color: '#10b981' },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Ideas', color: '#f59e0b' },
    { id: '10000000-0000-0000-0000-000000000004', name: 'Projects', color: '#8b5cf6' },
    { id: '10000000-0000-0000-0000-000000000005', name: 'Study', color: '#06b6d4' },
  ];

  for (const t of tagsToCreate) {
    await db.query(
      'INSERT INTO tags (id, user_id, name, color) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [t.id, userId, t.name, t.color]
    );
  }

  const notesToCreate = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      title: 'Welcome to NoteFlow 🚀',
      content: `<h2>Welcome to your clean, distraction-free workspace!</h2><p>NoteFlow is designed with a modern flat aesthetic to keep your focus squarely on your thoughts and tasks.</p><ul><li><strong>Rich formatting:</strong> Headings, lists, bold, italics, checklists, quotes & code blocks</li><li><strong>Organization:</strong> Pin important notes, mark favorites, organize with tags, and archive</li><li><strong>Safety:</strong> Instant auto-saving and full Trash bin with restore capabilities</li></ul><blockquote>"Simplicity is the prerequisite for reliability." — Edsger W. Dijkstra</blockquote>`,
      is_pinned: true,
      is_favorite: true,
      is_archived: false,
      tags: [tagsToCreate[0].id, tagsToCreate[2].id],
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      title: 'Product Architecture & Sprint Goals',
      content: `<h3>Sprint 24 Deliverables</h3><p>Key technical milestones for the upcoming production deployment:</p><ul class="checklist"><li data-checked="true">Implement PostgreSQL relational persistence</li><li data-checked="true">Distraction-free rich text editor with auto-save</li><li data-checked="true">Dark mode, Light mode & System theme synchronization</li><li data-checked="false">End-to-end security audits & input validation</li></ul><p>Architecture stack: <code>Express + PostgreSQL (PGlite) + React 19 + Tailwind CSS</code></p>`,
      is_pinned: true,
      is_favorite: false,
      is_archived: false,
      tags: [tagsToCreate[0].id, tagsToCreate[3].id],
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      title: 'Weekend Reading List & Research',
      content: `<h3>Articles & Books to Review</h3><p>Notes on software design patterns, state management, and minimalism in UI:</p><ol><li>Refactoring UI by Adam Wathan & Steve Schoger</li><li>Designing Data-Intensive Applications by Martin Kleppmann</li><li>Building Micro-Frontends & Modular Design Systems</li></ol><p><em>Remember to take structured handwritten summaries every Sunday morning.</em></p>`,
      is_pinned: false,
      is_favorite: true,
      is_archived: false,
      tags: [tagsToCreate[1].id, tagsToCreate[4].id],
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      title: 'Creative Project Brainstorming',
      content: `<h3>Next Gen Workspace Ideas</h3><p>Brainstorming features for collaborative note-taking and knowledge graphs:</p><ul><li>Bento-grid customizable dashboard widgets</li><li>Instant keyboard shortcuts (Cmd+K command palette)</li><li>Bi-directional wiki links [[Note Title]]</li><li>Encrypted local-first offline storage syncing</li></ul>`,
      is_pinned: false,
      is_favorite: false,
      is_archived: false,
      tags: [tagsToCreate[2].id, tagsToCreate[3].id],
    },
  ];

  for (const n of notesToCreate) {
    await db.query(
      `INSERT INTO notes (id, user_id, title, content, is_pinned, is_favorite, is_archived)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [n.id, userId, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived]
    );
    for (const tagId of n.tags) {
      await db.query(
        'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [n.id, tagId]
      );
    }
  }

  await persistDb(db);
  return userId;
}

async function loadOrSeedData(db: PGlite) {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (Array.isArray(data.users) && data.users.length > 0) {
        for (const u of data.users) {
          await db.query(
            `INSERT INTO users (id, name, email, password, avatar, pin_hash, reset_token, reset_token_expires, token_version, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`,
            [u.id, u.name, u.email, u.password, u.avatar, u.pin_hash || null, u.reset_token, u.reset_token_expires, u.token_version, u.created_at, u.updated_at]
          );
        }

        if (Array.isArray(data.tags)) {
          for (const t of data.tags) {
            await db.query(
              `INSERT INTO tags (id, user_id, name, color, created_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO NOTHING`,
              [t.id, t.user_id, t.name, t.color, t.created_at]
            );
          }
        }

        if (Array.isArray(data.notes)) {
          for (const n of data.notes) {
            await db.query(
              `INSERT INTO notes (id, user_id, title, content, is_pinned, is_favorite, is_archived, is_locked, deleted_at, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (id) DO NOTHING`,
              [n.id, n.user_id, n.title, n.content, n.is_pinned, n.is_favorite, n.is_archived, n.is_locked || false, n.deleted_at, n.created_at, n.updated_at]
            );
          }
        }

        if (Array.isArray(data.note_tags)) {
          for (const nt of data.note_tags) {
            await db.query(
              `INSERT INTO note_tags (note_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [nt.note_id, nt.tag_id]
            );
          }
        }
        return;
      }
    }
  } catch (err) {
    console.warn('[Database] Could not restore backup store, seeding fresh demo user:', err);
  }

  // If no backup or empty, seed demo user
  await seedDemoUser(db);
}

let saveTimeout: NodeJS.Timeout | null = null;

export async function persistDb(db?: PGlite): Promise<void> {
  const targetDb = db || dbInstance;
  if (!targetDb) return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      const usersRes = await targetDb.query('SELECT * FROM users');
      const notesRes = await targetDb.query('SELECT * FROM notes');
      const tagsRes = await targetDb.query('SELECT * FROM tags');
      const noteTagsRes = await targetDb.query('SELECT * FROM note_tags');

      const dump = {
        users: usersRes.rows,
        notes: notesRes.rows,
        tags: tagsRes.rows,
        note_tags: noteTagsRes.rows,
        saved_at: new Date().toISOString(),
      };

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      fs.writeFileSync(BACKUP_FILE, JSON.stringify(dump, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to persist backup snapshot:', err);
    }
  }, 100);
}

import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionAttempted = false;
let connectionError: string | null = null;

export interface MongoStatus {
  connected: boolean;
  uriProvided: boolean;
  database: string | null;
  status: string;
  error: string | null;
  counts: {
    users: number;
    notes: number;
    tags: number;
  };
}

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    connectionAttempted = true;
    connectionError = 'MONGODB_URI environment variable not configured.';
    return null;
  }

  if (db && client) {
    return db;
  }

  try {
    connectionAttempted = true;
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
    });

    await client.connect();
    // Default db name from URI or 'noteflow'
    db = client.db();
    connectionError = null;
    console.log(`[MongoDB] Connected successfully to database: ${db.databaseName}`);

    // Ensure indexes
    await ensureMongoIndexes(db);
    return db;
  } catch (err: any) {
    connectionError = err.message || 'Failed to connect to MongoDB';
    console.warn(`[MongoDB] Connection warning (running in fallback mode): ${connectionError}`);
    db = null;
    return null;
  }
}

export function getMongoDb(): Db | null {
  return db;
}

export function isMongoConnected(): boolean {
  return db !== null;
}

async function ensureMongoIndexes(database: Db) {
  try {
    const usersCol = database.collection('users');
    await usersCol.createIndex({ id: 1 }, { unique: true });
    await usersCol.createIndex({ email: 1 }, { unique: true });

    const notesCol = database.collection('notes');
    await notesCol.createIndex({ id: 1 }, { unique: true });
    await notesCol.createIndex({ user_id: 1 });
    await notesCol.createIndex({ user_id: 1, deleted_at: 1 });

    const tagsCol = database.collection('tags');
    await tagsCol.createIndex({ id: 1 }, { unique: true });
    await tagsCol.createIndex({ user_id: 1 });
    await tagsCol.createIndex({ user_id: 1, name: 1 });
  } catch (err) {
    console.warn('[MongoDB] Index creation non-blocking note:', err);
  }
}

export async function getMongoStatus(): Promise<MongoStatus> {
  const uriProvided = Boolean(process.env.MONGODB_URI);
  if (!db) {
    return {
      connected: false,
      uriProvided,
      database: null,
      status: uriProvided
        ? 'Connecting or authentication pending'
        : 'Standby: using resilient persistent storage. Add MONGODB_URI in Settings to connect Atlas.',
      error: connectionError,
      counts: { users: 0, notes: 0, tags: 0 },
    };
  }

  try {
    const [usersCount, notesCount, tagsCount] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('notes').countDocuments(),
      db.collection('tags').countDocuments(),
    ]);

    return {
      connected: true,
      uriProvided: true,
      database: db.databaseName,
      status: 'Active & Connected',
      error: null,
      counts: {
        users: usersCount,
        notes: notesCount,
        tags: tagsCount,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      uriProvided,
      database: db.databaseName,
      status: 'Connection error during health check',
      error: err.message,
      counts: { users: 0, notes: 0, tags: 0 },
    };
  }
}

/**
 * Mirror writes to MongoDB whenever a record is created or updated
 */
export async function syncUserToMongo(user: any) {
  if (!db) return;
  try {
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { ...user, updated_at: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB Sync] User write warning:', err);
  }
}

export async function syncNoteToMongo(note: any, tags: string[] = []) {
  if (!db) return;
  try {
    await db.collection('notes').updateOne(
      { id: note.id },
      { $set: { ...note, tags, updated_at: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB Sync] Note write warning:', err);
  }
}

export async function deleteNoteFromMongo(noteId: string) {
  if (!db) return;
  try {
    await db.collection('notes').deleteOne({ id: noteId });
  } catch (err) {
    console.warn('[MongoDB Sync] Note delete warning:', err);
  }
}

export async function syncTagToMongo(tag: any) {
  if (!db) return;
  try {
    await db.collection('tags').updateOne(
      { id: tag.id },
      { $set: { ...tag, updated_at: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB Sync] Tag write warning:', err);
  }
}

export async function deleteTagFromMongo(tagId: string) {
  if (!db) return;
  try {
    await db.collection('tags').deleteOne({ id: tagId });
  } catch (err) {
    console.warn('[MongoDB Sync] Tag delete warning:', err);
  }
}

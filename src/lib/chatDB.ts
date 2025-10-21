import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Chat {
  id?: number;
  title: string;
  messages: any[]; // Message[]
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatDB extends DBSchema {
  chats: {
    key: number;
    value: Chat;
    indexes: { 'by-pinned': boolean; 'by-createdAt': Date };
  };
}

let db: IDBPDatabase<ChatDB> | null = null;

export async function initDB() {
  if (db) return db;
  db = await openDB<ChatDB>('aiAdvisorChats', 1, {
    upgrade(db) {
      const chatStore = db.createObjectStore('chats', {
        keyPath: 'id',
        autoIncrement: true,
      });
      chatStore.createIndex('by-pinned', 'pinned');
      chatStore.createIndex('by-createdAt', 'createdAt');
    },
  });
  return db;
}

export async function getAllChats(): Promise<Chat[]> {
  const db = await initDB();
  return await db.getAll('chats');
}

export async function getChat(id: number): Promise<Chat | undefined> {
  const db = await initDB();
  return await db.get('chats', id);
}

export async function addChat(chat: Omit<Chat, 'id'>): Promise<number> {
  const db = await initDB();
  return await db.add('chats', chat);
}

export async function updateChat(id: number, updates: Partial<Chat>): Promise<void> {
  const db = await initDB();
  const chat = await db.get('chats', id);
  if (chat) {
    Object.assign(chat, updates, { updatedAt: new Date() });
    await db.put('chats', chat);
  }
}

export async function deleteChat(id: number): Promise<void> {
  const db = await initDB();
  await db.delete('chats', id);
}

export async function getPinnedChats(): Promise<Chat[]> {
  const db = await initDB();
  return await db.getAllFromIndex('chats', 'by-pinned', true);
}

export async function searchChats(query: string): Promise<Chat[]> {
  const db = await initDB();
  const allChats = await db.getAll('chats');
  return allChats.filter(chat =>
    chat.title.toLowerCase().includes(query.toLowerCase())
  );
}
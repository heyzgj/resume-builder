import Dexie, { type EntityTable } from 'dexie';
import { ResumeData, DesignSettings } from './types';

// Resume document stored in IndexedDB
export interface ResumeDocument {
    id: string;
    title: string;
    data: ResumeData;
    settings: DesignSettings;
    createdAt: Date;
    updatedAt: Date;
}

// Database schema
const db = new Dexie('ResumeBuilderDB') as Dexie & {
    resumes: EntityTable<ResumeDocument, 'id'>;
};

db.version(1).stores({
    resumes: 'id, title, updatedAt'
});

export { db };

// Helper functions
export const resumeDB = {
    // Get all resumes, sorted by most recently updated
    async getAll(): Promise<ResumeDocument[]> {
        return await db.resumes.orderBy('updatedAt').reverse().toArray();
    },

    // Get a single resume by ID
    async getById(id: string): Promise<ResumeDocument | undefined> {
        return await db.resumes.get(id);
    },

    // Create a new resume
    async create(title: string, data: ResumeData, settings: DesignSettings): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date();
        await db.resumes.add({
            id,
            title,
            data,
            settings,
            createdAt: now,
            updatedAt: now
        });
        return id;
    },

    // Update an existing resume
    async update(id: string, updates: Partial<Omit<ResumeDocument, 'id' | 'createdAt'>>): Promise<void> {
        await db.resumes.update(id, {
            ...updates,
            updatedAt: new Date()
        });
    },

    // Delete a resume
    async delete(id: string): Promise<void> {
        await db.resumes.delete(id);
    },

    // Duplicate a resume
    async duplicate(id: string): Promise<string | null> {
        const original = await db.resumes.get(id);
        if (!original) return null;

        const newId = crypto.randomUUID();
        const now = new Date();
        await db.resumes.add({
            ...original,
            id: newId,
            title: `${original.title} (副本)`,
            createdAt: now,
            updatedAt: now
        });
        return newId;
    },

    // Count total resumes
    async count(): Promise<number> {
        return await db.resumes.count();
    }
};

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'wishes.json');

interface Wish {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    year: number;
    timestamp: string;
}

// Helper: Ensure Data Directory Exists
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        // File doesn't exist, create dir and file
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, '[]');
    }
}

async function getWishes(): Promise<Wish[]> {
    await ensureDataFile();
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function saveWishes(wishes: Wish[]) {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(wishes, null, 2));
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const wishes = await getWishes();

    // Return wishes where current user is involved, or specific userId if admin?
    // Returning all wishes for now to let frontend filter (not sensitive data usually)
    // But better to filter if userId provided.

    if (userId) {
        const filtered = wishes.filter(w => w.senderId === userId || w.receiverId === userId);
        return NextResponse.json(filtered);
    }

    return NextResponse.json(wishes);
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { receiverId } = body;

        if (!receiverId) return NextResponse.json({ error: 'Missing receiver' }, { status: 400 });

        const wishes = await getWishes();
        const year = new Date().getFullYear();

        // Check duplicate for this year
        const exists = wishes.find(w => w.senderId === session.user.id && w.receiverId === receiverId && w.year === year);
        if (exists) {
            return NextResponse.json({ error: 'Already wished this year' }, { status: 400 });
        }

        const newWish: Wish = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            senderId: session.user.id,
            senderName: session.user.name || 'Colleague',
            receiverId,
            year,
            timestamp: new Date().toISOString()
        };

        wishes.push(newWish);
        await saveWishes(wishes);

        return NextResponse.json(newWish);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process wish' }, { status: 500 });
    }
}

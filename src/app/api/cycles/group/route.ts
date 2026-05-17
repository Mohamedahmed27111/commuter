import { NextResponse } from 'next/server';

// In-memory store for demo purposes
const groups = new Map<string, { code: string; createdAt: number; memberCount: number }>();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST() {
  let code = generateCode();
  // Ensure uniqueness
  while (groups.has(code)) code = generateCode();

  groups.set(code, { code, createdAt: Date.now(), memberCount: 1 });

  return NextResponse.json({ code }, { status: 201 });
}

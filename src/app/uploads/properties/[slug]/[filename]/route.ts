import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function contentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  return types[extension] ?? 'application/octet-stream';
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; filename: string }> }) {
  const { slug, filename } = await params;
  const safeSlug = path.basename(slug);
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'uploads', 'properties', safeSlug, safeFilename);

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType(safeFilename),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

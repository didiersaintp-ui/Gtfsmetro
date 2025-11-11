import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { generateId } from '@/lib/utils';
import type { UploadResponse, ErrorResponse } from '@/lib/gtfs/types';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      const error: ErrorResponse = {
        success: false,
        error: 'No file provided',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      const error: ErrorResponse = {
        success: false,
        error: 'Invalid file type. Please upload a .zip file',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const error: ErrorResponse = {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Generate unique ID for this upload
    const uploadId = generateId();
    const fileName = `${uploadId}.zip`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`File uploaded: ${fileName} (${file.size} bytes)`);

    const response: UploadResponse = {
      success: true,
      uploadId,
      fileName: file.name,
      fileSize: file.size,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

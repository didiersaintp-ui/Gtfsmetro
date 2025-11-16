import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';
import { parseGTFS } from '@/lib/gtfs/parser';
import { parsedDataCache } from '@/lib/cache/data-cache';
import type { ParseResponse, ErrorResponse } from '@/lib/gtfs/types';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      const error: ErrorResponse = {
        success: false,
        error: 'Upload ID is required',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Check if file exists
    const filePath = path.join(UPLOAD_DIR, `${uploadId}.zip`);
    if (!existsSync(filePath)) {
      const error: ErrorResponse = {
        success: false,
        error: 'Upload not found',
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Check cache first
    if (parsedDataCache.has(uploadId)) {
      console.log('Returning cached parsed data');
      const cachedData = parsedDataCache.get(uploadId);
      const response: ParseResponse = {
        success: true,
        data: cachedData,
        processingTime: Date.now() - startTime,
      };
      return NextResponse.json(response);
    }

    // Parse GTFS data
    console.log(`Parsing GTFS data for ${uploadId}...`);
    const parsedData = await parseGTFS(uploadId, filePath);

    // Cache the parsed data
    parsedDataCache.set(uploadId, parsedData);

    const processingTime = Date.now() - startTime;
    console.log(`GTFS parsed in ${processingTime}ms`);

    const response: ParseResponse = {
      success: true,
      data: parsedData,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Parse error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to parse GTFS data',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET endpoint to retrieve parsed data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      const error: ErrorResponse = {
        success: false,
        error: 'Upload ID is required',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const cachedData = parsedDataCache.get(uploadId);

    if (!cachedData) {
      const error: ErrorResponse = {
        success: false,
        error: 'Data not found. Please parse the GTFS data first.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    const response: ParseResponse = {
      success: true,
      data: cachedData,
      processingTime: 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET parse error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to retrieve parsed data',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

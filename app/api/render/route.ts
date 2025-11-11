import { NextRequest, NextResponse } from 'next/server';
import { generateMetroLayout } from '@/lib/layout/metro-layout';
import type { ErrorResponse } from '@/lib/gtfs/types';

// In-memory cache for parsed data (should match the cache in /parse route)
const parsedDataCache = new Map<string, any>();
const layoutCache = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, mode = 'metro', width = 1200, height = 800 } = body;

    if (!uploadId) {
      const error: ErrorResponse = {
        success: false,
        error: 'Upload ID is required',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Get parsed data from cache
    const parsedData = parsedDataCache.get(uploadId);

    if (!parsedData) {
      const error: ErrorResponse = {
        success: false,
        error: 'Parsed data not found. Please parse the GTFS data first.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Check layout cache
    const cacheKey = `${uploadId}-${mode}-${width}-${height}`;
    if (layoutCache.has(cacheKey)) {
      console.log('Returning cached layout');
      return NextResponse.json({
        success: true,
        layout: layoutCache.get(cacheKey),
      });
    }

    // Generate layout
    console.log(`Generating ${mode} layout...`);
    const startTime = Date.now();

    const layout = await generateMetroLayout(parsedData.routes, parsedData.stops, {
      width,
      height,
      simplify: mode === 'metro',
    });

    const processingTime = Date.now() - startTime;
    console.log(`Layout generated in ${processingTime}ms`);

    // Cache the layout
    layoutCache.set(cacheKey, layout);

    return NextResponse.json({
      success: true,
      layout,
      processingTime,
    });
  } catch (error) {
    console.error('Render error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to generate layout',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

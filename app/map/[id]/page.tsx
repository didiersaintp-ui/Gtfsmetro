'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Map, Network, Download, Loader2, ArrowLeft, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RealisticMap from '@/components/map/RealisticMap';
import MetroMap from '@/components/map/MetroMap';
import type { ParsedGTFSData, MetroMapLayout } from '@/lib/gtfs/types';
import { motion } from 'framer-motion';

export default function MapViewPage() {
  const params = useParams();
  const router = useRouter();
  const uploadId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedGTFSData | null>(null);
  const [metroLayout, setMetroLayout] = useState<MetroMapLayout | null>(null);
  const [activeTab, setActiveTab] = useState<'realistic' | 'metro'>('realistic');
  const [generatingLayout, setGeneratingLayout] = useState(false);

  useEffect(() => {
    loadData();
  }, [uploadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch parsed data
      const response = await fetch(`/api/parse?uploadId=${uploadId}`);

      if (!response.ok) {
        throw new Error('Failed to load data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load data');
      }

      setParsedData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateMetroLayout = async () => {
    if (!parsedData) return;

    try {
      setGeneratingLayout(true);

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          mode: 'metro',
          width: 1400,
          height: 900,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate layout');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate layout');
      }

      setMetroLayout(result.layout);
      setActiveTab('metro');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate layout');
    } finally {
      setGeneratingLayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading transit data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!parsedData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="h-6 w-px bg-border" />

              <div>
                <h1 className="text-lg font-bold">Transit Network Visualization</h1>
                <p className="text-xs text-muted-foreground">
                  {parsedData.stats.routeCount} routes • {parsedData.stats.stopCount} stops
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Network Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Total Routes</div>
                  <div className="text-2xl font-bold">{parsedData.stats.routeCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Stops</div>
                  <div className="text-2xl font-bold">{parsedData.stats.stopCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Trips</div>
                  <div className="text-2xl font-bold">{parsedData.stats.tripCount}</div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Routes by Type</div>
                  <div className="space-y-1">
                    {Object.entries(parsedData.stats.routesByType).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visualization Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'realistic' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('realistic')}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Realistic View
                </Button>
                <Button
                  variant={activeTab === 'metro' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (!metroLayout) {
                      generateMetroLayout();
                    } else {
                      setActiveTab('metro');
                    }
                  }}
                  disabled={generatingLayout}
                >
                  {generatingLayout ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Network className="w-4 h-4 mr-2" />
                  )}
                  Metro-Style View
                </Button>
                {generatingLayout && (
                  <p className="text-xs text-muted-foreground">
                    Generating schematic layout...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map Display */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <div className="p-4 border-b">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="realistic">
                        <Map className="w-4 h-4 mr-2" />
                        Realistic
                      </TabsTrigger>
                      <TabsTrigger
                        value="metro"
                        disabled={!metroLayout && !generatingLayout}
                      >
                        <Network className="w-4 h-4 mr-2" />
                        Metro-Style
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="realistic" className="mt-0">
                    <div className="h-[700px]">
                      <RealisticMap
                        routes={parsedData.routes}
                        stops={parsedData.stops}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="metro" className="mt-0">
                    <div className="h-[700px]">
                      {metroLayout ? (
                        <MetroMap layout={metroLayout} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                              Click "Generate Metro-Style View" to create schematic layout
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

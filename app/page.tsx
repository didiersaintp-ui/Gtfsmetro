'use client';

import { useState } from 'react';
import { Upload, Map, Zap } from 'lucide-react';
import FileDropzone from '@/components/upload/FileDropzone';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GTFS Metro Visualizer
              </h1>
              <p className="text-xs text-muted-foreground">
                Professional transit map rendering
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transform GTFS Data into
              <br />
              Beautiful Transit Maps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your GTFS feed and visualize it as a realistic geographic map
              or a stylized metro-like schematic diagram — in under a minute.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Easy Upload</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your GTFS .zip file — no configuration needed
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Dual Rendering</h3>
              <p className="text-sm text-muted-foreground">
                Toggle between realistic maps and stylized metro diagrams
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Processes complex urban networks in less than 60 seconds
              </p>
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <FileDropzone
              onUploadComplete={(id) => {
                setUploadId(id);
                setUploadStatus('success');
              }}
              onError={(err) => {
                setError(err);
                setUploadStatus('error');
              }}
              onStatusChange={setUploadStatus}
            />
          </motion.div>

          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js 14, Leaflet, D3.js, and advanced transit map algorithms
          </p>
          <p className="mt-2">
            Supports metro, tram, and bus networks from GTFS feeds
          </p>
        </div>
      </footer>
    </div>
  );
}

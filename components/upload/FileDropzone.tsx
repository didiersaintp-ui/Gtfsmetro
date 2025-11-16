'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDropzoneProps {
  onUploadComplete?: (uploadId: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'uploading' | 'processing' | 'success' | 'error') => void;
}

export default function FileDropzone({
  onUploadComplete,
  onError,
  onStatusChange,
}: FileDropzoneProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const updateStatus = (newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      // Validate file type
      if (!selectedFile.name.endsWith('.zip')) {
        const error = 'Please upload a valid GTFS .zip file';
        setErrorMessage(error);
        updateStatus('error');
        onError?.(error);
        return;
      }

      setFile(selectedFile);
      updateStatus('uploading');
      setProgress(0);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Upload file
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadResponse.json();
        setProgress(50);

        // Parse GTFS
        updateStatus('processing');
        const parseResponse = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId: uploadData.uploadId }),
        });

        if (!parseResponse.ok) {
          throw new Error('Parsing failed');
        }

        const parseData = await parseResponse.json();
        setProgress(100);

        // Success!
        updateStatus('success');
        onUploadComplete?.(uploadData.uploadId);

        // Redirect to map view after 1 second
        setTimeout(() => {
          router.push(`/map/${uploadData.uploadId}`);
        }, 1000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An error occurred';
        setErrorMessage(errorMsg);
        updateStatus('error');
        onError?.(errorMsg);
      }
    },
    [router, onUploadComplete, onError, updateStatus]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    maxFiles: 1,
    disabled: status === 'uploading' || status === 'processing',
  });

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                {...getRootProps()}
                className={`
                  cursor-pointer rounded-lg p-12 text-center transition-all
                  ${isDragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  {isDragActive ? 'Drop your GTFS file here' : 'Upload GTFS Feed'}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Drag and drop your GTFS .zip file, or click to browse
                </p>
                <Button>Select File</Button>
              </div>
            </motion.div>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <h3 className="mb-2 text-lg font-semibold">
                {status === 'uploading' ? 'Uploading...' : 'Processing GTFS data...'}
              </h3>
              {file && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {file.name} ({formatBytes(file.size)})
                </p>
              )}
              <div className="mx-auto max-w-md">
                <Progress value={progress} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {status === 'uploading'
                    ? 'Uploading your file...'
                    : 'Analyzing routes, stops, and shapes...'}
                </p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FileCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-green-600">
                Upload Successful!
              </h3>
              <p className="text-sm text-muted-foreground">
                Redirecting to map view...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-red-600">
                Upload Failed
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {errorMessage || 'An error occurred during upload'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  updateStatus('idle');
                  setErrorMessage('');
                  setProgress(0);
                }}
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

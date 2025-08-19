'use client'

import { useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useFileUploadWithReactQuery } from '@/hooks/use-file-upload-react-query'
import { FileItem } from '@/hooks/use-file-upload'

// Create a client
const queryClient = new QueryClient()

// Wrap component in provider
export function MultiFileUploadWithReactQuery() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileUploadComponent />
    </QueryClientProvider>
  )
}

function FileUploadComponent() {
  // Use our custom hook for file upload state management
  const {
    files,
    updateFilesFromServerData,
    handleFileDrop,
    removeFile,
    formatFileSize,
  } = useFileUploadWithReactQuery()

  // Fetch uploaded files using React Query
  const {
    data: uploadedFilesData,
    error,
    isLoading,
  } = useQuery<FileItem[]>({
    queryKey: ['files'],
    queryFn: () => fetch('/api/files').then((res) => res.json()),
    refetchOnWindowFocus: false,
  })

  // Update files with data from the server
  useEffect(() => {
    if (uploadedFilesData) {
      updateFilesFromServerData(uploadedFilesData)
    }
  }, [uploadedFilesData, updateFilesFromServerData])

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Combined Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && files.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Loading files...
            </p>
          ) : error && files.length === 0 ? (
            <p className="text-center text-destructive">Failed to load files</p>
          ) : files.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No files uploaded yet
            </p>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                      {file.uploadedAt && (
                        <> • {new Date(file.uploadedAt).toLocaleDateString()}</>
                      )}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2" />
                    )}
                    {file.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        {file.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <Badge
                      variant={
                        file.status === 'completed'
                          ? 'default'
                          : file.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {file.status}
                    </Badge>
                    {file.status === 'completed' && file.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

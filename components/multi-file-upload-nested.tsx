'use client'

import { useDropzone } from 'react-dropzone'
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
import { useNestedFileUpload, FileItem } from '@/hooks/use-nested-file-upload'

export function MultiFileUploadNested() {
  // Use our custom hook for nested file upload state management
  const {
    files,
    allData,
    handleFileDrop,
    removeFile,
    formatFileSize,
    isLoading,
    error,
  } = useNestedFileUpload()

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
          <CardTitle>Upload Files (Nested Data Structure)</CardTitle>
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
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Drag & drop files here</h3>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      {allData && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>
                <strong>Version:</strong> {allData.metadata.systemInfo.version}
              </p>
              <p>
                <strong>Environment:</strong>{' '}
                {allData.metadata.systemInfo.environment}
              </p>
              <p>
                <strong>Last Updated:</strong> {allData.metadata.lastUpdated}
              </p>
              <p>
                <strong>Total Uploads:</strong> {allData.analytics.totalUploads}
              </p>
              <p>
                <strong>User:</strong> {allData.user.name} ({allData.user.role})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Uploaded Files{' '}
            {allData && (
              <Badge variant="outline" className="ml-2">
                {allData.files.count} files
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading files...</div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">
              Error loading files. Please try refreshing the page.
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files uploaded yet
            </div>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 p-2 border rounded-lg bg-background hover:bg-accent/10 transition-colors"
                >
                  {/* File icon */}
                  <div className="shrink-0">
                    <File className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium text-sm truncate mr-2">
                        {file.name}
                      </span>
                      {file.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.uploadedAt && <span className="mx-1">•</span>}
                      {file.uploadedAt && (
                        <time dateTime={file.uploadedAt}>
                          {new Date(file.uploadedAt).toLocaleString()}
                        </time>
                      )}
                    </div>
                    {file.status === 'uploading' && (
                      <Progress
                        value={file.progress}
                        className="h-1 mt-2"
                        aria-label="Upload progress"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View file</span>
                      </a>
                    )}
                    {file.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeFile(file.id)}
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

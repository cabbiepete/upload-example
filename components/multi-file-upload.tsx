'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import useSWR, { mutate } from 'swr'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

// Combined file interface that handles both uploading and uploaded states
interface FileItem {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'completed' | 'error'
  progress?: number
  error?: string
  url?: string
  uploadedAt?: string
  file?: File
  lastModified?: number
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

export function MultiFileUpload() {
  const [files, setFiles] = useState<FileItem[]>([])
  const { toast } = useToast()

  // Fetch uploaded files using SWR
  const {
    data: uploadedFilesData,
    error,
    isLoading,
  } = useSWR<FileItem[]>('/api/files', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  // Initialize the files state with uploaded files from API
  useEffect(() => {
    if (uploadedFilesData) {
      // Convert the uploaded files to our FileItem format
      const uploadedItems = uploadedFilesData.map((file) => ({
        ...file,
        status: 'completed' as const,
        progress: 100,
      }))

      // Merge with existing files, but avoid duplicates by comparing IDs
      setFiles((current) => {
        // Keep all uploading files
        const uploadingFiles = current.filter(
          (f) => f.status === 'uploading' || f.status === 'error'
        )

        // Filter out any uploaded files that may be duplicates
        const uploadingIds = new Set(uploadingFiles.map((f) => f.id))
        const newUploadedFiles = uploadedItems.filter(
          (f) => !uploadingIds.has(f.id)
        )

        return [...uploadingFiles, ...newUploadedFiles]
      })
    }
  }, [uploadedFilesData])

  const uploadFile = async (fileItem: FileItem) => {
    const formData = new FormData()
    if (fileItem.file) {
      formData.append('file', fileItem.file)
    } else {
      // This should not happen, but just in case
      toast({
        title: 'Upload failed',
        description: `Cannot upload ${fileItem.name}. File data is missing.`,
        variant: 'destructive',
      })
      return
    }

    // Add additional metadata to help server-side processing
    formData.append('filename', fileItem.name)
    formData.append('filetype', fileItem.type)
    formData.append('filesize', fileItem.size?.toString())

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      )

      // Upload the file
      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f))
          )
        },
      })

      // Update status to completed when done
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                // If the response includes the uploaded file details, update those too
                ...(response.data && {
                  url: response.data.url,
                  uploadedAt:
                    response.data.uploadedAt || new Date().toISOString(),
                }),
              }
            : f
        )
      )

      // Revalidate the uploaded files list
      mutate('/api/files')

      toast({
        title: 'Upload successful',
        description: `${fileItem.name} has been uploaded successfully.`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'error',
                error: 'Upload failed',
              }
            : f
        )
      )

      toast({
        title: 'Upload failed',
        description: `Failed to upload ${fileItem.name}. Please try again.`,
        variant: 'destructive',
      })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles.map((file) => ({
      file: file,
      // spread does not grab lastModified, lastModifiedDate, name, size, type,
      // or webkitRelativePath so set these explicitly
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'uploading' as const,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Upload each file
    newFiles.forEach(uploadFile)
  }, [])

  const removeFile = (fileId: string) => {
    // Find the file to check its status
    const fileToRemove = files.find((f) => f.id === fileId)

    if (fileToRemove?.status === 'completed') {
      // If it's a completed upload, we need to delete it from the server
      deleteUploadedFile(fileId)
    } else {
      // For uploading or error files, just remove from state
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    }
  }

  const deleteUploadedFile = async (fileId: string) => {
    try {
      await axios.delete(`/api/files/${fileId}`)
      mutate('/api/files')
      toast({
        title: 'File deleted',
        description: 'File has been deleted successfully.',
      })
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }

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

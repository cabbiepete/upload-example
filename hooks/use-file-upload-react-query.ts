import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { FileItem } from './use-file-upload'

interface UseFileUploadWithReactQueryProps {
  uploadUrl?: string
  filesApiUrl?: string
  filesQueryKey?: any[]
}

export function useFileUploadWithReactQuery({
  uploadUrl = '/api/upload',
  filesApiUrl = '/api/files',
  filesQueryKey = ['files'],
}: UseFileUploadWithReactQueryProps = {}) {
  const [files, setFiles] = useState<FileItem[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Update files state with server data (avoiding duplicates with in-progress uploads)
  const updateFilesFromServerData = useCallback((serverFiles: FileItem[]) => {
    if (!serverFiles) return

    // Convert the uploaded files to our FileItem format
    const uploadedItems = serverFiles.map((file) => ({
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
  }, [])

  // Upload a file
  const uploadFile = useCallback(
    async (fileItem: FileItem) => {
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
            f.id === fileItem.id
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        )

        // Upload the file
        const response = await axios.post(uploadUrl, formData, {
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

        // Invalidate the query to refetch the files
        queryClient.invalidateQueries({ queryKey: filesQueryKey })

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
    },
    [toast, uploadUrl, filesQueryKey, queryClient]
  )

  // Handle file drops
  const handleFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: FileItem[] = acceptedFiles.map((file) => ({
        file: file,
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
    },
    [uploadFile]
  )

  // Remove a file
  const removeFile = useCallback(
    (fileId: string) => {
      // Find the file to check its status
      const fileToRemove = files.find((f) => f.id === fileId)

      if (fileToRemove?.status === 'completed') {
        // If it's a completed upload, we need to delete it from the server
        deleteUploadedFile(fileId)
      } else {
        // For uploading or error files, just remove from state
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    },
    [files]
  )

  // Delete an uploaded file
  const deleteUploadedFile = useCallback(
    async (fileId: string) => {
      try {
        await axios.delete(`${filesApiUrl}/${fileId}`)

        // Remove from our state
        setFiles((prev) => prev.filter((f) => f.id !== fileId))

        // Invalidate the query to refetch the files
        queryClient.invalidateQueries({ queryKey: filesQueryKey })

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
    },
    [filesApiUrl, toast, queryClient, filesQueryKey]
  )

  // Format file size for display
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }, [])

  return {
    files,
    setFiles,
    updateFilesFromServerData,
    uploadFile,
    handleFileDrop,
    removeFile,
    deleteUploadedFile,
    formatFileSize,
  }
}

import { useCallback } from 'react'
import axios from 'axios'
import useSWR, { mutate, KeyedMutator } from 'swr'
import { useToast } from '@/hooks/use-toast'

// File item interface for both uploading and uploaded files
export interface FileItem {
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

interface UseFileUploadProps {
  uploadUrl?: string
  filesApiUrl?: string
}

// Simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useFileUpload({
  uploadUrl = '/api/upload',
  filesApiUrl = '/api/files',
}: UseFileUploadProps = {}) {
  const { toast } = useToast()

  // Fetch uploaded files using SWR
  const {
    data: files = [],
    error,
    isLoading,
    mutate: mutateFiles,
  } = useSWR<FileItem[]>(filesApiUrl, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

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
        // Optimistically update the file status to uploading
        mutateFiles(
          (currentFiles) =>
            currentFiles?.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: 'uploading' as const, progress: 0 }
                : f
            ) || [],
          false // don't revalidate yet
        )

        // Upload the file
        const response = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0

            // Update progress optimistically
            mutateFiles(
              (currentFiles) =>
                currentFiles?.map((f) =>
                  f.id === fileItem.id ? { ...f, progress } : f
                ) || [],
              false // don't revalidate yet
            )
          },
        })

        // Update status to completed when done
        mutateFiles(
          (currentFiles) =>
            currentFiles?.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'completed' as const,
                    progress: 100,
                    // If the response includes the uploaded file details, update those too
                    ...(response.data && {
                      url: response.data.url,
                      uploadedAt:
                        response.data.uploadedAt || new Date().toISOString(),
                    }),
                  }
                : f
            ) || [],
          false
        )

        // Finally revalidate with the server
        mutateFiles()

        toast({
          title: 'Upload successful',
          description: `${fileItem.name} has been uploaded successfully.`,
        })
      } catch (error) {
        console.error('Upload error:', error)

        // Update the file status to error
        mutateFiles(
          (currentFiles) =>
            currentFiles?.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'error' as const,
                    error: 'Upload failed',
                  }
                : f
            ) || [],
          false // don't revalidate with server on error
        )

        toast({
          title: 'Upload failed',
          description: `Failed to upload ${fileItem.name}. Please try again.`,
          variant: 'destructive',
        })
      }
    },
    [toast, uploadUrl, filesApiUrl, mutateFiles]
  )

  // Handle file drops
  const handleFileDrop = useCallback(
    (acceptedFiles: File[]) => {
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

      // Optimistically add new files to the list
      mutateFiles((currentFiles = []) => [...currentFiles, ...newFiles], false)

      // Upload each file
      newFiles.forEach(uploadFile)
    },
    [uploadFile, mutateFiles]
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
        // For uploading or error files, just remove from state optimistically
        mutateFiles(
          (currentFiles = []) => currentFiles.filter((f) => f.id !== fileId),
          false
        )
      }
    },
    [files, mutateFiles]
  )

  // Delete an uploaded file
  const deleteUploadedFile = useCallback(
    async (fileId: string) => {
      try {
        // Optimistically remove the file from state
        mutateFiles(
          (currentFiles = []) => currentFiles.filter((f) => f.id !== fileId),
          false
        )

        // Delete the file from the server
        await axios.delete(`${filesApiUrl}/${fileId}`)

        // Revalidate with server after deletion
        mutateFiles()

        toast({
          title: 'File deleted',
          description: 'File has been deleted successfully.',
        })
      } catch (error) {
        // Revalidate with server on error to restore correct state
        mutateFiles()

        toast({
          title: 'Delete failed',
          description: 'Failed to delete file. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [filesApiUrl, toast, mutateFiles]
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
    mutateFiles,
    uploadFile,
    handleFileDrop,
    removeFile,
    deleteUploadedFile,
    formatFileSize,
    isLoading,
    error,
  }
}

import { useCallback } from 'react'
import axios from 'axios'
import useSWR, { mutate } from 'swr'
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

// Interface for the nested response structure
export interface NestedDataResponse {
  metadata: {
    lastUpdated: string
    totalCount: number
    systemInfo: {
      version: string
      environment: string
    }
  }
  config: {
    maxFileSize: number
    allowedTypes: string[]
    uploadEnabled: boolean
  }
  files: {
    member: FileItem[]
    totalSize: number
    count: number
  }
  user: {
    id: string
    name: string
    role: string
    preferences: {
      theme: string
      notifications: boolean
    }
  }
  analytics: {
    totalUploads: number
    averageFileSize: number
    popularFileTypes: string[]
  }
}

const emptyData: NestedDataResponse = {
  metadata: {
    lastUpdated: '',
    totalCount: 0,
    systemInfo: {
      version: '',
      environment: '',
    },
  },
  config: {
    maxFileSize: 0,
    allowedTypes: [],
    uploadEnabled: false,
  },
  files: {
    member: [],
    totalSize: 0,
    count: 0,
  },
  user: {
    id: '',
    name: '',
    role: '',
    preferences: {
      theme: '',
      notifications: false,
    },
  },
  analytics: {
    totalUploads: 0,
    averageFileSize: 0,
    popularFileTypes: [],
  },
}

interface UseNestedFileUploadProps {
  uploadUrl?: string
  filesApiUrl?: string
}

// Simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Named flag for avoiding revalidation
const doNotRevalidate = false

export function useNestedFileUpload({
  uploadUrl = '/api/nested-upload',
  filesApiUrl = '/api/nested-data',
}: UseNestedFileUploadProps = {}) {
  const { toast } = useToast()

  // Fetch nested data structure using SWR
  const {
    data,
    error,
    isLoading,
    mutate: mutateData,
  } = useSWR<NestedDataResponse>(filesApiUrl, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    // Add dedupingInterval to prevent excessive revalidation
    dedupingInterval: 1000,
    // Keep stale data while revalidating to prevent flashing
    keepPreviousData: true,
  })

  // Helper to get the files from the nested structure
  const files = data?.files?.member || []

  // Format file size to a human-readable string
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Remove a file from the list
  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        await fetch(`/api/files/${fileId}`, { method: 'DELETE' })

        // Optimistically update UI by removing the file
        if (data) {
          mutateData(
            {
              ...data,
              files: {
                ...data.files,
                member: data.files.member.filter((f) => f.id !== fileId),
                count: data.files.count - 1,
                // Recalculate total size
                totalSize: data.files.member
                  .filter((f) => f.id !== fileId)
                  .reduce((sum, file) => sum + file.size, 0),
              },
              // Update metadata
              metadata: {
                ...data.metadata,
                totalCount: data.metadata.totalCount - 1,
                lastUpdated: new Date().toISOString(),
              },
            },
            false
          )
        }

        // Revalidate the data
        mutateData()

        toast({
          title: 'File removed',
          description: 'The file has been removed successfully.',
        })
      } catch (error) {
        console.error('Error removing file:', error)
        toast({
          title: 'Error',
          description: 'Failed to remove the file. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [data, mutateData, toast]
  )

  // Upload a file
  const uploadFile = useCallback(
    async (fileItem: FileItem) => {
      const formData = new FormData()

      if (fileItem.file) {
        formData.append('file', fileItem.file)
      } else {
        toast({
          title: 'Upload failed',
          description: `Cannot upload ${fileItem.name}. File data is missing.`,
          variant: 'destructive',
        })
        return
      }

      // Add additional metadata
      formData.append('filename', fileItem.name)
      formData.append('filetype', fileItem.type)
      formData.append('filesize', fileItem.size?.toString())

      console.log('Uploading file: fileItem.id: ', fileItem.id)

      try {
        // Make sure the file item exists in the member array
        // If not, add it (this ensures the file appears in the UI)
        mutateData((currentData) => {
          if (typeof currentData === 'undefined') {
            console.warn('Unexpected empty data on starting file upload')
            return emptyData
          }
          // calculate the updated files list that is the only thing we are updating
          const data: NestedDataResponse = currentData || emptyData

          let fileExists = data.files.member.some(
            (f: FileItem) => f.id === fileItem.id
          )
          console.log('uploadFile: fileExists: ', fileExists)
          // if the file exists, update its status otherwise add it to the
          // array
          if (fileExists) {
            data.files.member = data.files.member.map((f: FileItem) => {
              if (f.id === fileItem.id) {
                return { ...f, status: 'uploading' as const, progress: 0 }
              }
              return f
            })
          } else {
            data.files.member.push({
              ...fileItem,
              status: 'uploading' as const,
              progress: 0,
            })
          }

          return data
        }, doNotRevalidate)

        // Upload the file
        const response = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0

            // mutate data with a callback to get the current data and do not rev
            mutateData((currentData) => {
              if (typeof currentData === 'undefined') {
                console.warn('Unexpected empty data on upload progress')
                return emptyData
              }
              // Get the current data state
              const data = currentData || emptyData
              // Make sure the file exists in the current state
              const fileExists = data.files.member.some(
                (f: FileItem) => f.id === fileItem.id
              )

              // make an updated files array including the progress update on
              // the file if we found one
              if (fileExists) {
                const updatedFiles = data.files.member.map((f: FileItem) =>
                  f.id === fileItem.id ? { ...f, progress } : f
                )

                // return updated data
                return {
                  ...data,
                  files: {
                    ...data.files,
                    member: updatedFiles,
                  },
                }
              }
              return data
            }, doNotRevalidate)
          },
        })

        // Update status to completed when done in a mutateData with callback so
        // we have the current data
        mutateData((currentData) => {
          if (typeof currentData === 'undefined') {
            console.warn('Unexpected empty data on completed file upload')
            return emptyData
          }
          const data = currentData || emptyData
          // Find the uploaded file in the current data
          const fileExists = data.files.member.some(
            (f: FileItem) => f.id === fileItem.id
          )

          if (fileExists) {
            const updatedFiles = data.files.member.map((f: FileItem) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'completed' as const,
                    progress: 100,
                    // If the response includes the uploaded file details, update those too
                    ...(response.data?.file && {
                      url: response.data.file.url,
                      uploadedAt:
                        response.data.file.uploadedAt ||
                        new Date().toISOString(),
                    }),
                  }
                : f
            )
            toast({
              title: 'Upload successful',
              description: `${fileItem.name} has been uploaded successfully.`,
            })
            // Return updated data with the new files array
            return {
              ...data,
              files: {
                ...data.files,
                member: updatedFiles,
              },
              // Update metadata
              metadata: {
                ...data.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }
          }
          // otherwise return data unchanged
          return data
        }, doNotRevalidate)
      } catch (error) {
        console.error('Upload error:', error)

        // Update the file status to error in the nested structure using a
        // callback to ensure we have the current data
        mutateData((currentData) => {
          if (typeof currentData === 'undefined') {
            console.warn('Unexpected empty data on upload error')
            return emptyData
          }
          const data = currentData || emptyData
          const updatedFiles = data.files.member.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: 'Upload failed',
                }
              : f
          )
          return {
            ...data,
            files: {
              ...data.files,
              member: updatedFiles,
            },
          }
        })

        toast({
          title: 'Upload failed',
          description: `Failed to upload ${fileItem.name}. Please try again.`,
          variant: 'destructive',
        })
      }
    },
    [data, mutateData, toast, uploadUrl]
  )

  // Handle file drops
  const handleFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Create new file items
      const newFiles: FileItem[] = acceptedFiles.map((file) => ({
        file,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 10),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        status: 'uploading',
        progress: 0,
      }))

      console.log('handleFileDrop: ', newFiles)

      // Add the new files to the nested data structure optimistically
      if (data) {
        // Create a new data object with the new files added
        const updatedData = {
          ...data,
          files: {
            ...data.files,
            member: [...newFiles, ...data.files.member],
            count: data.files.count + newFiles.length,
          },
        }

        console.log(
          'optimistically updating all dropped files: ',
          updatedData.files
        )

        // Update the local state immediately and skip revalidation for now
        mutateData(updatedData, doNotRevalidate)
      }

      // Upload each file sequentially to avoid race conditions
      // const uploadSequentially = async () => {
      //   // the issue is that uploadFile relies on request.data which is not
      //   // guarenteed to have updated with what we just updated
      //   for (const fileItem of newFiles) {
      //     await uploadFile(fileItem)
      //   }
      // }

      // uploadSequentially()

      // upload files in parallel
      const uploadFilesInParallel = async () => {
        await Promise.all(newFiles.map((fileItem) => uploadFile(fileItem)))
      }

      uploadFilesInParallel()
    },
    [data, mutateData, uploadFile]
  )

  console.log('useNestedFileUpload: files: ', files)

  return {
    files,
    allData: data,
    error,
    isLoading,
    uploadFile,
    handleFileDrop,
    removeFile,
    formatFileSize,
    mutateData,
  }
}

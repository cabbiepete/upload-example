"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import useSWR, { mutate } from "swr"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

interface FileWithProgress extends File {
  id: string
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

export function MultiFileUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<FileWithProgress[]>([])
  const { toast } = useToast()

  // Fetch uploaded files using SWR
  const {
    data: uploadedFiles = [],
    error,
    isLoading,
  } = useSWR<UploadedFile[]>("/api/files", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const uploadFile = async (file: FileWithProgress) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadingFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f)))

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0

          setUploadingFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)))
        },
      })

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "completed", progress: 100 } : f)),
      )

      // Revalidate the uploaded files list
      mutate("/api/files")

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error",
                error: "Upload failed",
              }
            : f,
        ),
      )

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])

    // Upload each file
    newFiles.forEach(uploadFile)
  }, [])

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const deleteUploadedFile = async (fileId: string) => {
    try {
      await axios.delete(`/api/files/${fileId}`)
      mutate("/api/files")
      toast({
        title: "File deleted",
        description: "File has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select files</p>
                <p className="text-sm text-muted-foreground">Maximum file size: 10MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    {file.status === "uploading" && <Progress value={file.progress} className="mt-2" />}
                    {file.status === "error" && <p className="text-xs text-destructive mt-1">{file.error}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {file.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                    <Badge
                      variant={
                        file.status === "completed" ? "default" : file.status === "error" ? "destructive" : "secondary"
                      }
                    >
                      {file.status}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeUploadingFile(file.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading files...</p>
          ) : error ? (
            <p className="text-center text-destructive">Failed to load files</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-center text-muted-foreground">No files uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(file.url, "_blank")}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteUploadedFile(file.id)}>
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

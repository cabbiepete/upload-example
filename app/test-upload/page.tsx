'use client'

import { useState, useRef } from 'react'

export default function TestUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      return
    }

    setError(null)
    setResponse(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', file.name)
      formData.append('filetype', file.type)
      formData.append('filesize', file.size.toString())

      // Log what we're sending
      console.log('Sending file:', file.name, file.size, file.type)

      // Send request
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set content-type header, let browser set it with boundary
      })

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      setResponse(data)

      // Try fallback endpoint if needed
      if (!data.files || Object.keys(data.files).length === 0) {
        console.log('No files processed, trying legacy endpoint...')
        const legacyResponse = await fetch('/api/upload-legacy', {
          method: 'POST',
          body: formData,
        })

        const legacyData = await legacyResponse.json()
        setResponse((prev: any) => ({ ...prev, legacyResult: legacyData }))
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test File Upload</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Select file:</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          disabled={!file}
        >
          Upload File
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60 text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

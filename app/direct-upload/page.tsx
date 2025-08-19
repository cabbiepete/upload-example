'use client'

import { useState, useRef } from 'react'

export default function DirectFetchUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError(null)
    setResponse(null)

    try {
      // Create form data with file
      const formData = new FormData()
      formData.append('file', file)

      console.log(
        `Uploading file: ${file.name} (${file.size} bytes, ${file.type})`
      )

      // Use fetch directly
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Let browser set content-type with boundary
      })

      const data = await response.json()
      console.log('Response:', data)
      setResponse(data)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Direct Fetch Upload</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full py-2 px-4 rounded ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-4">
          <h3 className="font-medium">Response:</h3>
          <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

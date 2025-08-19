'use client'

import { useState, useRef } from 'react'

export default function BinaryUploadTest() {
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
      console.log(
        `Uploading binary file: ${file.name} (${file.size} bytes, ${file.type})`
      )

      // Upload as raw binary data without FormData
      // Log what we're sending
      console.log(
        `Sending binary file: ${file.name}, type: ${file.type}, size: ${file.size}`
      )

      // Try the original endpoint
      const response = await fetch('/api/binary-upload', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': file.name,
          'x-file-size': file.size.toString(),
          // Headers are case-insensitive but some proxies might normalize them
        },
      })

      let responseData = await response.json()

      // If the first attempt didn't work, try the simplified endpoint
      if (!responseData.success) {
        console.log('First attempt failed, trying simplified endpoint...')
        const simplifiedResponse = await fetch('/api/simple-binary', {
          method: 'POST',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        })

        const simplifiedData = await simplifiedResponse.json()
        responseData = {
          ...responseData,
          simplifiedResult: simplifiedData,
          success: simplifiedData.success,
        }
      }

      console.log('Response:', responseData)
      setResponse(responseData)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Binary File Upload Test</h2>
      <p className="mb-4 text-gray-600">
        This method bypasses FormData completely and uploads the raw file
        directly.
      </p>

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
          {isUploading ? 'Uploading...' : 'Upload as Binary'}
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

      {response?.file?.url && (
        <div className="mt-4">
          <h3 className="font-medium">Uploaded File:</h3>
          <div className="mt-2 p-3 bg-gray-100 rounded">
            <a
              href={response.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View Uploaded File
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

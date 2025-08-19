'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UploadComparison() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<{
    fetch?: any
    axios?: any
    binary?: any
  }>({})
  const [isLoading, setIsLoading] = useState<{
    fetch?: boolean
    axios?: boolean
    binary?: boolean
  }>({})
  const [errors, setErrors] = useState<{
    fetch?: string | null
    axios?: string | null
    binary?: string | null
  }>({})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadWithFetch = async () => {
    if (!file) return

    setIsLoading((prev) => ({ ...prev, fetch: true }))
    setErrors((prev) => ({ ...prev, fetch: null }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', file.name)
      formData.append('filetype', file.type)
      formData.append('filesize', file.size.toString())

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header
      })

      const data = await response.json()
      setResults((prev) => ({ ...prev, fetch: data }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        fetch: err instanceof Error ? err.message : String(err),
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }))
    }
  }

  const uploadWithAxios = async () => {
    if (!file) return

    setIsLoading((prev) => ({ ...prev, axios: true }))
    setErrors((prev) => ({ ...prev, axios: null }))

    try {
      // Import axios dynamically
      const axios = (await import('axios')).default

      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResults((prev) => ({ ...prev, axios: response.data }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        axios: err instanceof Error ? err.message : String(err),
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, axios: false }))
    }
  }

  const uploadWithBinary = async () => {
    if (!file) return

    setIsLoading((prev) => ({ ...prev, binary: true }))
    setErrors((prev) => ({ ...prev, binary: null }))

    try {
      console.log(
        `Uploading binary file: ${file.name}, type: ${file.type}, size: ${file.size}`
      )

      const response = await fetch('/api/binary-upload', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': file.name,
          'x-file-size': file.size.toString(),
        },
      })

      const data = await response.json()
      setResults((prev) => ({ ...prev, binary: data }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        binary: err instanceof Error ? err.message : String(err),
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, binary: false }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        File Upload Methods Comparison
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Select a file to test all methods:
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded p-2 w-full"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB,{' '}
            {file.type})
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={uploadWithFetch}
          disabled={!file || isLoading.fetch}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded disabled:bg-gray-400"
        >
          {isLoading.fetch ? 'Uploading...' : 'Upload with Fetch API'}
        </button>

        <button
          onClick={uploadWithAxios}
          disabled={!file || isLoading.axios}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded disabled:bg-gray-400"
        >
          {isLoading.axios ? 'Uploading...' : 'Upload with Axios'}
        </button>

        <button
          onClick={uploadWithBinary}
          disabled={!file || isLoading.binary}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded disabled:bg-gray-400"
        >
          {isLoading.binary ? 'Uploading...' : 'Upload as Binary'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fetch Results */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-2">Fetch API Results</h2>
          {errors.fetch ? (
            <div className="text-red-500">{errors.fetch}</div>
          ) : results.fetch ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-60">
              {JSON.stringify(results.fetch, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No results yet</p>
          )}
        </div>

        {/* Axios Results */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-2">Axios Results</h2>
          {errors.axios ? (
            <div className="text-red-500">{errors.axios}</div>
          ) : results.axios ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-60">
              {JSON.stringify(results.axios, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No results yet</p>
          )}
        </div>

        {/* Binary Results */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-bold mb-2">Binary Results</h2>
          {errors.binary ? (
            <div className="text-red-500">{errors.binary}</div>
          ) : results.binary ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-60">
              {JSON.stringify(results.binary, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No results yet</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Test Pages</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Link href="/test-upload" className="text-blue-500 hover:underline">
              Test Upload (Working Method)
            </Link>
          </li>
          <li>
            <Link
              href="/direct-upload"
              className="text-blue-500 hover:underline"
            >
              Direct Fetch Upload
            </Link>
          </li>
          <li>
            <Link
              href="/binary-upload"
              className="text-blue-500 hover:underline"
            >
              Binary Upload
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

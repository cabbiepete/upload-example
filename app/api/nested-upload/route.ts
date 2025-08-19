import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Maximum file size in bytes (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// disable json parsing
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    // Check upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    console.log(`Upload directory path: ${uploadDir}`)

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      console.log('Upload directory does not exist, creating it...')
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.startsWith('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Invalid content-type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse the form data
    const formData = await req.formData()

    // Get file from form data
    const file = formData.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a unique filename with timestamp prefix
    const timestamp = Date.now()
    const originalName = file.name
    const uniqueFilename = `${timestamp}-${originalName}`
    const filepath = path.join(uploadDir, uniqueFilename)

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    fs.writeFileSync(filepath, uint8Array)

    // Get file stats
    const stats = fs.statSync(filepath)

    // File information for the response
    const fileInfo = {
      id: timestamp.toString(),
      name: originalName,
      size: stats.size,
      type: path.extname(originalName).substring(1) || 'unknown',
      url: `/uploads/${uniqueFilename}`,
      uploadedAt: new Date().toISOString(),
      status: 'completed',
    }

    // Return the file information in a structure similar to the nested-data API
    const response = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        operation: 'upload',
        success: true,
      },
      // Return the file details in a nested structure
      file: fileInfo,
      files: {
        member: [fileInfo], // Include in the member array format
        totalSize: fileInfo.size,
        count: 1,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ error: 'File upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

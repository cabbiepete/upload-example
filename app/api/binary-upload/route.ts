import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// In Next.js App Router, we don't need to disable body parsing
// The App Router doesn't auto-parse binary data by default

// Binary file upload handler
export async function POST(req: NextRequest) {
  try {
    console.log('Starting binary file upload handler')
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // Check Content-Type and custom headers for binary uploads
    const contentType = req.headers.get('content-type') || ''
    const originalFilename = req.headers.get('x-file-name') || ''
    console.log(`Received request with Content-Type: ${contentType}`)
    console.log(`Original filename from header: ${originalFilename}`)

    // Generate a unique filename with extension based on content type or original filename
    let extension = 'dat'

    if (originalFilename) {
      // Extract extension from the original filename if available
      const filenameParts = originalFilename.split('.')
      if (filenameParts.length > 1) {
        extension = filenameParts[filenameParts.length - 1]
      }
    } else if (contentType.includes('image/jpeg')) extension = 'jpg'
    else if (contentType.includes('image/png')) extension = 'png'
    else if (contentType.includes('application/pdf')) extension = 'pdf'
    else if (contentType.includes('text/plain')) extension = 'txt'

    const filename = `${randomUUID()}.${extension}`
    console.log(`Generated filename: ${filename}`)

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Get file content as buffer
    const buffer = Buffer.from(await req.arrayBuffer())
    console.log(`Received ${buffer.length} bytes of data`)

    // Save the file
    const filePath = path.join(uploadDir, filename)
    console.log(`Writing file to: ${filePath}`)
    fs.writeFileSync(filePath, new Uint8Array(buffer))

    // Check if the file was successfully saved
    const exists = fs.existsSync(filePath)
    const size = exists ? fs.statSync(filePath).size : 0
    console.log(`File exists: ${exists}, size: ${size} bytes`)

    return NextResponse.json({
      success: true,
      file: {
        name: filename,
        path: filePath,
        size: size,
        url: `/uploads/${filename}`,
      },
    })
  } catch (error) {
    console.error('Error handling binary upload:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

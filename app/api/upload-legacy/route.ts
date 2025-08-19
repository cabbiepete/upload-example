import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// This is a fallback implementation using raw request processing
export async function POST(req: NextRequest) {
  try {
    console.log('Starting legacy upload handler')
    const contentType = req.headers.get('content-type') || ''

    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      )
    }

    // Get the raw body as ArrayBuffer
    const rawData = await req.arrayBuffer()
    console.log(`Received ${rawData.byteLength} bytes of raw data`)

    // Create a unique filename
    const uniqueFilename = `${randomUUID()}-upload.dat`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save the raw data (this will include form boundaries but at least we'll have something)
    const filePath = path.join(uploadDir, uniqueFilename)
    console.log(`Saving raw upload data to: ${filePath}`)

    // Write directly using fs
    fs.writeFileSync(filePath, new Uint8Array(rawData))

    // Check if the file was created
    const fileStats = fs.existsSync(filePath) ? fs.statSync(filePath) : null
    const fileSize = fileStats ? fileStats.size : 0

    return NextResponse.json({
      success: true,
      message: 'Raw upload data saved',
      file: {
        path: filePath,
        size: fileSize,
        url: `/uploads/${uniqueFilename}`,
      },
    })
  } catch (error) {
    console.error('Error in legacy upload handler:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

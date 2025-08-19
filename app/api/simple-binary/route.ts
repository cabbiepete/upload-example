import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Simple binary upload handler that focuses on the essentials
export async function POST(req: NextRequest) {
  try {
    // Log all headers for debugging
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // Get the raw data
    const data = await req.arrayBuffer()
    console.log(`Received ${data.byteLength} bytes of binary data`)

    // Generate a filename with random UUID
    const filename = `${randomUUID()}-upload.bin`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Write file to disk
    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, new Uint8Array(data))

    // Verify file was saved
    const fileExists = fs.existsSync(filePath)
    const fileSize = fileExists ? fs.statSync(filePath).size : 0
    console.log(`File saved to ${filePath} (${fileSize} bytes)`)

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: filename,
        size: fileSize,
        url: `/uploads/${filename}`,
      },
    })
  } catch (error) {
    console.error('Binary upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

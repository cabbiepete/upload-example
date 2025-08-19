import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// This API endpoint simulates a more complex nested data structure
// similar to what the user described, with several unrelated properties
// and a nested files object with a 'member' array containing the actual files
export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    // Default empty files array if directory doesn't exist
    let fileList: any[] = []

    if (existsSync(uploadsDir)) {
      const files = await readdir(uploadsDir)
      fileList = await Promise.all(
        files
          .filter((filename) => {
            // exclude dotfiles
            return !filename.startsWith('.') && !filename.startsWith('._')
          })
          .map(async (filename) => {
            const filepath = path.join(uploadsDir, filename)
            const stats = await stat(filepath)

            const parts = filename.split('-')
            const timestampStr = parts[0]
            const timestamp = Number.parseInt(timestampStr, 10)

            // Validate timestamp and provide fallback
            const isValidTimestamp = !isNaN(timestamp) && timestamp > 0
            const originalName =
              parts.length > 1 ? parts.slice(1).join('-') : filename
            const uploadDate = isValidTimestamp
              ? new Date(timestamp)
              : new Date(stats.birthtime || stats.mtime)

            return {
              id: isValidTimestamp ? timestamp.toString() : filename,
              name: originalName,
              size: stats.size,
              type: path.extname(filename).substring(1) || 'unknown',
              url: `/uploads/${filename}`,
              uploadedAt: uploadDate.toISOString(),
              status: 'completed',
            }
          })
      )

      // Sort by upload date (newest first)
      fileList.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
    }

    // Create the complex nested response structure
    const response = {
      // Add some unrelated metadata properties at the top level
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalCount: fileList.length,
        systemInfo: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      },
      // Add some config properties
      config: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        uploadEnabled: true,
      },
      // Nested files object with a 'member' property containing the files array
      files: {
        member: fileList,
        totalSize: fileList.reduce((sum, file) => sum + file.size, 0),
        count: fileList.length,
      },
      // Add other unrelated data
      user: {
        id: 'user123',
        name: 'Demo User',
        role: 'admin',
        preferences: {
          theme: 'light',
          notifications: true,
        },
      },
      // Add some fake analytics
      analytics: {
        totalUploads: 245 + fileList.length,
        averageFileSize:
          fileList.length > 0
            ? Math.round(
                fileList.reduce((sum, file) => sum + file.size, 0) /
                  fileList.length
              )
            : 0,
        popularFileTypes: ['png', 'jpg', 'pdf'],
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching nested data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

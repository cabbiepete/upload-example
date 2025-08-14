import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads")

    if (!existsSync(uploadsDir)) {
      return NextResponse.json([])
    }

    const files = await readdir(uploadsDir)
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(uploadsDir, filename)
        const stats = await stat(filepath)

        // Extract timestamp and original name from filename
        const parts = filename.split("-")
        const timestamp = parts[0]
        const originalName = parts.slice(1).join("-")

        return {
          id: timestamp,
          name: originalName,
          size: stats.size,
          type: path.extname(filename).substring(1),
          url: `/uploads/${filename}`,
          uploadedAt: new Date(Number.parseInt(timestamp)).toISOString(),
        }
      }),
    )

    // Sort by upload date (newest first)
    fileList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json(fileList)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

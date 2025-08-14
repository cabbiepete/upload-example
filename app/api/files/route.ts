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

        const parts = filename.split("-")
        const timestampStr = parts[0]
        const timestamp = Number.parseInt(timestampStr, 10)

        // Validate timestamp and provide fallback
        const isValidTimestamp = !isNaN(timestamp) && timestamp > 0
        const originalName = parts.length > 1 ? parts.slice(1).join("-") : filename
        const uploadDate = isValidTimestamp ? new Date(timestamp) : new Date(stats.birthtime || stats.mtime)

        return {
          id: isValidTimestamp ? timestamp.toString() : filename,
          name: originalName,
          size: stats.size,
          type: path.extname(filename).substring(1) || "unknown",
          url: `/uploads/${filename}`,
          uploadedAt: uploadDate.toISOString(),
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

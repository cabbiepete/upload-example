import { type NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { readdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const uploadsDir = path.join(process.cwd(), "public", "uploads")

    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Find the file with the matching timestamp
    const files = await readdir(uploadsDir)
    const targetFile = files.find((filename) => filename.startsWith(`${id}-`))

    if (!targetFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const filepath = path.join(uploadsDir, targetFile)
    await unlink(filepath)

    return NextResponse.json({
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

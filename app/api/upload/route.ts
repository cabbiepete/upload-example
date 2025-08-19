// No need for formidable library - Let's use the built-in FormData parser with Next.js App Router
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
    // Debug upload directory at the start
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    console.log(`Upload directory path: ${uploadDir}`)
    console.log(`Current working directory: ${process.cwd()}`)

    // Check if upload directory exists and is writable
    try {
      if (!fs.existsSync(uploadDir)) {
        console.log('Upload directory does not exist, creating it...')
        fs.mkdirSync(uploadDir, { recursive: true })
        console.log('Upload directory created successfully')
      }

      // Check write permissions by writing a test file
      const testFilePath = path.join(uploadDir, '.test-write-access')
      fs.writeFileSync(testFilePath, 'test')
      fs.unlinkSync(testFilePath) // Remove test file
      console.log('Upload directory is writable')
    } catch (dirError) {
      console.error('Error with upload directory:', dirError)
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || ''
    console.log(`Content-Type: ${contentType}`)
    if (!contentType.startsWith('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Invalid content-type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse the form data using the built-in FormData API
    const formData = await req.formData()

    console.log(
      'FormData received:',
      JSON.stringify(Object.fromEntries(formData))
    )

    // Debug formData
    console.log('FormData entries:')
    for (const entry of formData.entries()) {
      console.log(
        `- Entry: ${entry[0]}, Type: ${typeof entry[1]}, Instance of File: ${
          entry[1] instanceof File
        }`
      )
      if (entry[1] instanceof File) {
        const file = entry[1]
        console.log(
          `  File details: name=${file.name}, size=${file.size}, type=${file.type}`
        )
        console.log('entry[1] type: ', typeof entry[1])
        if (typeof entry[1] === 'object') {
          for (const [key, value] of Object.entries(entry[1])) {
            console.log(`  Field details: name=${key}, value=${value}`)
          }
        }
      } else {
        console.log(
          ` Not a file Field details: name=${entry[0]}, value=${entry[1]}`
        )
        console.log('not a file value as JSON: ', JSON.stringify(entry[1]))
      }
    }

    // Process fields
    const fields: Record<string, string> = {}

    // Process files
    const files: Record<
      string,
      {
        filename: string
        type: string
        size: number
        savedAs?: string
        url?: string
        path?: string // For debugging
        exists?: boolean // For debugging
        sizeOnDisk?: number // For debugging
        error?: string // For error reporting
        data?: ArrayBuffer
      }
    > = {}

    // Extract all form fields and files
    for (const [name, value] of formData.entries()) {
      console.log(
        `Processing entry: ${name}, Type: ${typeof value}, Constructor: ${
          value.constructor?.name || 'unknown'
        }`
      )

      if (typeof value === 'string') {
        // Check if this might be a file reference
        if (name === 'file' && value === '[object Object]') {
          console.log(
            `Found file field as [object Object], looking for metadata fields...`
          )

          // Look for the associated metadata that should be in other fields
          const filename = formData.get('filename')?.toString()
          const filetype = formData.get('filetype')?.toString()
          const filesizeStr = formData.get('filesize')?.toString()
          const filesize = filesizeStr ? parseInt(filesizeStr, 10) : 0

          if (filename) {
            console.log(
              `Found file metadata: ${filename}, ${filetype}, ${filesize} bytes`
            )

            // Create a unique filename
            const uniqueFilename = `${randomUUID()}-${filename}`
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            const filePath = path.join(uploadDir, uniqueFilename)

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }

            // Since we can't get the actual file content in this case,
            // we'll create an empty file with metadata
            const metadata = {
              originalName: filename,
              mimeType: filetype || 'application/octet-stream',
              size: filesize,
              uploadedAt: new Date().toISOString(),
              error:
                'File content was not correctly transmitted. Please use the test-upload or binary-upload method instead.',
            }

            // Write metadata to file
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2))

            // Add it to our files response
            files[name] = {
              filename: filename,
              type: filetype || 'application/octet-stream',
              size: filesize,
              savedAs: uniqueFilename,
              url: `/uploads/${uniqueFilename}`,
              exists: true,
              error: 'File data was not properly received. See file metadata.',
            }

            // Continue to next field
            continue
          }
        }

        // Normal form field
        console.log(`Adding field: ${name} = ${value}`)
        fields[name] = value
      } else if (
        value instanceof Blob ||
        (typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'size' in value &&
          'type' in value)
      ) {
        // This is a file (File extends Blob)
        const file = value

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          return new Response(
            JSON.stringify({
              error: `File is too large. Maximum size is ${
                MAX_FILE_SIZE / (1024 * 1024)
              }MB`,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }

        // Generate a unique filename to prevent overwriting
        const uniqueFilename = `${randomUUID()}-${file.name}`
        console.log(`Generated unique filename: ${uniqueFilename}`)

        // Use a non-dynamic path for uploads - this is important for Next.js
        // First try with process.cwd()
        const rootDir = process.cwd()
        const uploadDir = path.join(rootDir, 'public', 'uploads')
        console.log(`Using upload directory: ${uploadDir}`)
        console.log(`Root directory: ${rootDir}`)

        // Ensure the uploads directory exists with full permissions
        try {
          if (!fs.existsSync(uploadDir)) {
            console.log(`Creating upload directory: ${uploadDir}`)
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 })
          }
          console.log(
            `Upload directory status: ${
              fs.existsSync(uploadDir) ? 'exists' : 'does not exist'
            }`
          )
        } catch (dirErr) {
          console.error(`Error creating upload directory: ${dirErr}`)
        }

        const filePath = path.join(uploadDir, uniqueFilename)
        console.log(`Full file path for saving: ${filePath}`)

        // Save file to disk
        try {
          console.log(`Starting file save: ${file.name} to ${filePath}`)
          console.log(`File size: ${file.size} bytes`)

          const bytes = await file.arrayBuffer()
          console.log(`ArrayBuffer created: ${bytes.byteLength} bytes`)

          // Use more robust file writing approach
          try {
            console.log(
              `Writing file data (${bytes.byteLength} bytes) to ${filePath}`
            )

            // Convert ArrayBuffer to Buffer for Node.js file operations
            const buffer = Buffer.from(bytes)

            // Try to write file using multiple methods for redundancy
            console.log('Method 1: writeFileSync with Uint8Array')
            fs.writeFileSync(filePath, new Uint8Array(buffer))

            // Verify file was created and has content
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath)
              console.log(
                `File created successfully. Size on disk: ${stats.size} bytes`
              )
            } else {
              console.error('File was not created by writeFileSync!')

              // Try alternative method with stream
              console.log('Method 2: createWriteStream')
              const writeStream = fs.createWriteStream(filePath)
              writeStream.write(buffer)
              writeStream.end()
              console.log('Write stream completed')
            }
          } catch (writeErr) {
            console.error(`Error during file write: ${writeErr}`)
            throw writeErr // rethrow to be caught by outer try/catch
          }

          // Verify file was saved
          const fileExists = fs.existsSync(filePath)
          const fileSize = fileExists ? fs.statSync(filePath).size : 0
          console.log(
            `File exists: ${fileExists}, Size on disk: ${fileSize} bytes`
          )

          // Add file information to response
          files[name] = {
            filename: file.name,
            savedAs: uniqueFilename,
            type: file.type,
            size: file.size,
            path: filePath, // For debugging
            exists: fileExists,
            sizeOnDisk: fileSize,
            url: `/uploads/${uniqueFilename}`, // Public URL to access the file
          }
        } catch (err) {
          const saveError = err as Error
          console.error(`Error saving file ${file.name}:`, saveError)
          files[name] = {
            filename: file.name,
            type: file.type,
            size: file.size,
            error: saveError.message,
          }
        }
      }
    }

    // Log summary of processed files
    console.log(
      `Processed ${Object.keys(files).length} files and ${
        Object.keys(fields).length
      } form fields`
    )
    Object.keys(files).forEach((fieldName) => {
      const fileInfo = files[fieldName]
      console.log(
        `- File "${fieldName}": ${fileInfo.filename}, ${fileInfo.size} bytes, ${
          fileInfo.exists ? 'saved successfully' : 'save failed'
        }`
      )
    })

    // Return the parsed data
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${Object.keys(files).length} files successfully`,
        fields,
        files,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing form data:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process form data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

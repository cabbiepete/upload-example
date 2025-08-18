// No need for formidable library - Let's use the built-in FormData parser with Next.js App Router
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

// Maximum file size in bytes (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Invalid content-type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the form data using the built-in FormData API
    const formData = await req.formData();
    
    // Process fields
    const fields: Record<string, string> = {};
    
    // Process files
    const files: Record<string, { 
      filename: string;
      type: string;
      size: number;
      savedAs?: string;
      url?: string;
      data?: ArrayBuffer;
    }> = {};

    // Extract all form fields and files
    for (const [name, value] of formData.entries()) {
      if (typeof value === 'string') {
        // This is a form field
        fields[name] = value;
      } else if (value instanceof File) {
        // This is a file
        const file = value;
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({ error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Generate a unique filename to prevent overwriting
        const uniqueFilename = `${randomUUID()}-${file.name}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, uniqueFilename);
        
        // Save file to disk
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, new Uint8Array(bytes));
        
        // Add file information to response
        files[name] = {
          filename: file.name,
          savedAs: uniqueFilename,
          type: file.type,
          size: file.size,
          url: `/uploads/${uniqueFilename}` // Public URL to access the file
        };
      }
    }

    // Return the parsed data
    return new Response(JSON.stringify({ fields, files }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing form data:', error);
    return new Response(JSON.stringify({ error: 'Failed to process form data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

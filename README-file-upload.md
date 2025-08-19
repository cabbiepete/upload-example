# File Upload Components

This folder contains components and hooks for handling file uploads with a unified state management approach, including support for complex nested data structures.

## Key Solution: Working with Nested Data Structures

When working with deeply nested data structures in React applications, maintaining state consistency during asynchronous operations like file uploads can be challenging. The solution implemented in this project uses mutation with callbacks to ensure that each operation is working with the most up-to-date data:

```typescript
// Using callbacks with mutate to ensure current data access
mutateData((currentData) => {
  if (typeof currentData === 'undefined') {
    return emptyData
  }
  const data = currentData || emptyData
  // Make updates based on the current data
  return {
    ...data,
    files: {
      ...data.files,
      member: updatedFiles,
    },
  }
}, doNotRevalidate)
```

This approach solves several common issues:

1. **Race conditions** - By using callbacks with the current data state, operations that happen in parallel don't overwrite each other
2. **Stale data** - Each mutation has access to the latest state, even if multiple mutations are queued
3. **Data consistency** - The nested structure is preserved throughout the update process

A demonstration of this solution can be viewed in the [screen recording](docs/working-nested-object-update.mov).

## Components

### MultiFileUpload

The main component that provides a drag-and-drop interface for uploading files. It uses SWR for data fetching and displays a combined list of both uploading and uploaded files.

```tsx
import { MultiFileUpload } from '@/components/multi-file-upload'

export default function UploadPage() {
  return (
    <div>
      <h1>File Upload</h1>
      <MultiFileUpload />
    </div>
  )
}
```

### MultiFileUploadWithReactQuery

Similar to `MultiFileUpload` but uses React Query instead of SWR. You'll need to install React Query to use this component:

```bash
npm install @tanstack/react-query
# or
pnpm add @tanstack/react-query
# or
yarn add @tanstack/react-query
```

```tsx
import { MultiFileUploadWithReactQuery } from '@/components/multi-file-upload-react-query'

export default function UploadPage() {
  return (
    <div>
      <h1>File Upload</h1>
      <MultiFileUploadWithReactQuery />
    </div>
  )
}
```

## Hooks

### useFileUpload

A custom hook that encapsulates all the file upload state management logic. You can use this hook in your own components to implement custom UIs.

```tsx
import { useFileUpload } from '@/hooks/use-file-upload'

function MyCustomUploadComponent() {
  const {
    files,
    updateFilesFromServerData,
    handleFileDrop,
    removeFile,
    formatFileSize,
  } = useFileUpload({
    uploadUrl: '/api/custom-upload', // optional custom endpoint
    filesApiUrl: '/api/custom-files', // optional custom endpoint
  })

  // Rest of your component...
}
```

### useFileUploadWithReactQuery

Similar to `useFileUpload` but integrates with React Query. Requires React Query to be installed and a QueryClientProvider to be set up.

```tsx
import { useFileUploadWithReactQuery } from '@/hooks/use-file-upload-react-query'

function MyCustomUploadComponent() {
  const {
    files,
    updateFilesFromServerData,
    handleFileDrop,
    removeFile,
    formatFileSize,
  } = useFileUploadWithReactQuery({
    uploadUrl: '/api/custom-upload',
    filesApiUrl: '/api/custom-files',
    filesQueryKey: ['custom-files'], // optional custom query key
  })

  // Rest of your component...
}
```

### useNestedFileUpload

A specialized hook for handling file uploads within complex nested data structures. This hook uses SWR with mutate callbacks to ensure state consistency during async operations.

```tsx
import { useNestedFileUpload } from '@/hooks/use-nested-file-upload'

function MyNestedUploadComponent() {
  const {
    files,
    allData, // Access to the complete nested data structure
    handleFileDrop,
    removeFile,
    formatFileSize,
    mutateData, // For custom mutations to the nested structure
  } = useNestedFileUpload({
    uploadUrl: '/api/nested-upload',
    filesApiUrl: '/api/nested-data',
  })

  // Rest of your component...
}
```

## File Structure

```
components/
  ├── multi-file-upload.tsx             # Main component using SWR
  ├── multi-file-upload-useState.tsx    # Reference implementation with useState only
  ├── multi-file-upload-react-query.tsx # Version using React Query
  ├── multi-file-upload-nested.tsx      # Component for nested data structures
  └── multi-file-upload-combined.tsx    # Combined implementation with multiple approaches

hooks/
  ├── use-file-upload.ts                # Custom hook using SWR
  ├── use-file-upload-react-query.ts    # Custom hook using React Query
  └── use-nested-file-upload.ts         # Hook for handling nested data structures
```

## API Endpoints

These components expect the following API endpoints:

### Standard Endpoints

- `GET /api/files` - Returns a list of uploaded files
- `POST /api/upload` - Uploads a file
- `DELETE /api/files/:id` - Deletes a file

### Nested Data Structure Endpoints

- `GET /api/nested-data` - Returns the complex nested data structure including files
- `POST /api/nested-upload` - Uploads a file to the nested structure
- `DELETE /api/files/:id` - Deletes a file (shared with standard implementation)

You can customize these endpoints by passing options to the hooks.

## Data Interfaces

### File Interface

All hooks use a common `FileItem` interface:

```ts
interface FileItem {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'completed' | 'error'
  progress?: number
  error?: string
  url?: string
  uploadedAt?: string
  file?: File
  lastModified?: number
}
```

This interface combines properties for both uploading and uploaded files, allowing for a seamless transition between states.

### Nested Data Structure

For the nested data implementation, files are stored within a complex nested structure:

```ts
interface NestedDataResponse {
  metadata: {
    lastUpdated: string
    totalCount: number
    systemInfo: {
      version: string
      environment: string
    }
  }
  config: {
    maxFileSize: number
    allowedTypes: string[]
    uploadEnabled: boolean
  }
  files: {
    member: FileItem[] // Files stored here
    totalSize: number
    count: number
  }
  user: {
    id: string
    name: string
    // ...other user properties
  }
  // ...other nested properties
}
```

The nested structure presents unique challenges for state management during async operations, which are addressed using mutation callbacks to ensure data consistency.

## Comparison Page

The application includes a comparison page that demonstrates different file upload implementations side by side:

- Standard fetch API
- Axios
- Binary upload (for larger files)
- Nested data structure implementation
- React Query implementation

You can view this comparison at `/comparison` to see the differences in implementation approaches and performance.

![Demo Recording](docs/working-nested-object-update.mov)

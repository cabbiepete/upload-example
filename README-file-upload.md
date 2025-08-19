# File Upload Components

This folder contains components and hooks for handling file uploads with a unified state management approach.

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

## File Structure

```
components/
  ├── multi-file-upload.tsx          # Main component using SWR
  ├── multi-file-upload-useState.tsx # Reference implementation with useState only
  └── multi-file-upload-react-query.tsx # Version using React Query

hooks/
  ├── use-file-upload.ts             # Custom hook using SWR
  └── use-file-upload-react-query.ts # Custom hook using React Query
```

## API Endpoints

These components expect the following API endpoints:

- `GET /api/files` - Returns a list of uploaded files
- `POST /api/upload` - Uploads a file
- `DELETE /api/files/:id` - Deletes a file

You can customize these endpoints by passing options to the hooks.

## File Interface

Both hooks use a common `FileItem` interface:

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

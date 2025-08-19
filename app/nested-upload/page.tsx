import { MultiFileUploadNested } from '@/components/multi-file-upload-nested'

export const metadata = {
  title: 'Nested Data Structure File Upload Example',
  description: 'Example of file uploads with a complex nested data structure',
}

export default function NestedUploadPage() {
  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Nested Data Structure Upload</h1>
        <p className="text-muted-foreground">
          This example demonstrates file uploads with a complex nested data
          structure, where files are stored in a nested property path
          (files.member) within the API response.
        </p>
      </div>
      <MultiFileUploadNested />
    </div>
  )
}

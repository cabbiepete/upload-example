import { MultiFileUpload } from "@/components/multi-file-upload"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Multiple File Upload Demo</h1>
        <MultiFileUpload />
      </div>
    </main>
  )
}

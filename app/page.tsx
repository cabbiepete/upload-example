import { MultiFileUpload } from '@/components/multi-file-upload'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Multiple File Upload Demo
        </h1>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="font-semibold text-blue-800 mb-2">
            Testing Upload Methods
          </h2>
          <p className="text-blue-700 mb-3">
            If you're experiencing upload issues, try the test pages below:
          </p>
          <p className="text-green-700 mb-3 font-medium">
            New! Check out our solution for handling file uploads within nested data structures, solving race conditions and ensuring data consistency during async operations.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-blue-600">
            <li>
              <Link href="/comparison" className="hover:underline">
                Compare All Upload Methods
              </Link>
            </li>
            <li>
              <Link href="/test-upload" className="hover:underline">
                Simple Upload Test (Working Method)
              </Link>
            </li>
            <li>
              <Link href="/binary-upload" className="hover:underline">
                Binary Upload Test
              </Link>
            </li>
            <li>
              <Link href="/nested-upload" className="hover:underline">
                Nested Data Structure Upload
              </Link>
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">New</span>
            </li>
          </ul>
        </div>
        <MultiFileUpload />
      </div>
    </main>
  )
}

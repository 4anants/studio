'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error('Global Error caught:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-lg overflow-auto">
                <p className="font-bold">Error Message:</p>
                <p>{error.message}</p>
                {error.digest && <p className="text-xs mt-2">Digest: {error.digest}</p>}
            </div>
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    )
}

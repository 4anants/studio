'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react'

export function UploadDialog({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('');

  const handleUpload = async () => {
    if (!fileName) return;
    const fileInput = document.getElementById('document') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setIsUploading(true)
    setIsComplete(false)
    setUploadProgress(0)

    // Simulate upload progress for UX
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'Personal');

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      clearInterval(interval)
      setUploadProgress(100)
      setIsUploading(false)
      setIsComplete(true)

      // Wait a bit on the success screen
      await new Promise((resolve) => setTimeout(resolve, 1500))

      startTransition(() => {
        onUploadComplete()
      })

      setOpen(false)
      // Reset state for next time
      setTimeout(() => {
        setIsComplete(false)
        setUploadProgress(0)
        setFileName('')
      }, 500)
    } catch (error) {
      console.error("Upload error:", error);
      clearInterval(interval);
      setIsUploading(false);
      alert("Upload failed. Please try again.");
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setIsUploading(false);
      setIsComplete(false);
      setUploadProgress(0);
      setFileName('');
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload a new document</DialogTitle>
          <DialogDescription>
            Choose a file to upload. It will be saved as a "Personal" document.
          </DialogDescription>
        </DialogHeader>
        {isUploading || isComplete ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {isComplete ? (
              <>
                <FileCheck2 className="h-16 w-16 text-green-500" />
                <p className="text-lg font-medium">Upload Complete!</p>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-lg font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="w-[60%]" />
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document">Document</Label>
                <Input id="document" type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="doc-type">Document Type</Label>
                <Input id="doc-type" type="text" value="Personal" disabled readOnly />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleUpload} disabled={!fileName}>
                Upload
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface UploadAreaProps {
  onFileSelect: (file: File) => void
  isProcessing: boolean
  preview?: string | null
  onClear?: () => void
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export function UploadArea({
  onFileSelect,
  isProcessing,
  preview,
  onClear,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB = 10,
}: UploadAreaProps) {
  const [isDragActive, setIsDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSelect(file)
    }
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0])
    }
  }

  const validateAndSelect = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      alert(`Please select a valid image file (${acceptedTypes.join(", ")})`)
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    onFileSelect(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (preview && !isProcessing) {
    return (
      <Card className="w-full animate-fade-in">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted/30">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {onClear && (
              <button
                onClick={onClear}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "w-full border-2 border-dashed transition-all duration-200",
        isDragActive && "border-primary bg-primary/5",
        !isDragActive && "border-border hover:border-primary/50"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">
              {isProcessing ? "Processing..." : "Drop image here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProcessing 
                ? "Running U-Net segmentation model"
                : `Supports: JPEG, PNG, WebP (max ${maxSizeMB}MB)`
              }
            </p>
          </div>
          
          {!isProcessing && (
            <Button variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); handleClick() }}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
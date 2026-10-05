"use client"

import * as React from "react"
import { Loader2, Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UploadArea } from "@/components/upload-area"
import { SegmentationViewer } from "@/components/segmentation-viewer"
import { Header } from "@/components/header"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function Home() {
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = React.useState<string | null>(null)
  const [maskImage, setMaskImage] = React.useState<string | null>(null)
  const [resultImage, setResultImage] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileSelect = React.useCallback((file: File) => {
    setOriginalFile(file)
    setError(null)
    setMaskImage(null)
    setResultImage(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleClear = React.useCallback(() => {
    setOriginalFile(null)
    setOriginalPreview(null)
    setMaskImage(null)
    setResultImage(null)
    setError(null)
  }, [])

  const handleSegment = React.useCallback(async () => {
    if (!originalFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", originalFile)

      const response = await fetch("/api/segment", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Segmentation failed")
      }

      const data = await response.json()
      
      // Convert base64 to blob URLs
      if (data.mask) setMaskImage(`data:image/png;base64,${data.mask}`)
      if (data.result) setResultImage(`data:image/png;base64,${data.result}`)
      if (data.original) setOriginalPreview(`data:image/png;base64,${data.original}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }, [originalFile])

  const handleReset = React.useCallback(() => {
    handleClear()
  }, [handleClear])

  const handleDownload = React.useCallback(() => {
    if (!resultImage) return
    
    const link = document.createElement("a")
    link.href = resultImage
    link.download = `segmented-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [resultImage])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col pt-16 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6 animate-slide-up" style={{ animationDelay: "0ms" }}>
              <SegmentationViewer
                originalImage={originalPreview}
                maskImage={maskImage}
                resultImage={resultImage}
                isProcessing={isProcessing}
              />
              
              {error && (
                <Card className="border-destructive/50 bg-destructive/5 animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <div className="flex-1 flex items-center gap-3">
                  {originalFile && !isProcessing && !resultImage && (
                    <Button
                      onClick={handleSegment}
                      disabled={isProcessing}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Run Segmentation
                    </Button>
                  )}
                  
                  {resultImage && !isProcessing && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={handleDownload} className="gap-2">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Download segmented image</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={handleReset} className="gap-2">
                            <RotateCcw className="w-4 h-4" />
                            <span>Reset</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Start over</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
                
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Image
                  </CardTitle>
                  <CardDescription>
                    Select an image to segment using the U-Net model
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <UploadArea
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                    preview={originalPreview}
                    onClear={handleClear}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Model Info
                  </CardTitle>
                  <CardDescription>
                    U-Net architecture for biomedical image segmentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Architecture</span>
                      <span className="font-medium text-foreground">U-Net</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Encoder</span>
                      <span className="font-medium text-foreground">4 levels (64→512)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Input Size</span>
                      <span className="font-medium text-foreground">256×256</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Output</span>
                      <span className="font-medium text-foreground">Binary mask</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      This model uses a U-Net architecture with skip connections for precise 
                      biomedical image segmentation. The animation shows: raw model output → 
                      probability heatmap → composed overlay → final segmented result.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
          <span>Built with Next.js, shadcn/ui, and PyTorch</span>
          <span>U-Net Segmentation Demo</span>
        </div>
      </footer>
    </div>
  )
}
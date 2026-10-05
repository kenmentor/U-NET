"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentationViewerProps {
  originalImage: string | null
  maskImage: string | null
  resultImage: string | null
  isProcessing: boolean
  onAnimationComplete?: () => void
}

type AnimationStage = "idle" | "mask" | "reveal" | "complete"

export function SegmentationViewer({
  originalImage,
  maskImage,
  resultImage,
  isProcessing,
  onAnimationComplete,
}: SegmentationViewerProps) {
  const [stage, setStage] = React.useState<AnimationStage>("idle")
  const [maskProgress, setMaskProgress] = React.useState(0)
  const [revealProgress, setRevealProgress] = React.useState(0)
  const [maskOpacity, setMaskOpacity] = React.useState(0)
  const [originalOpacity, setOriginalOpacity] = React.useState(1)
  const [resultOpacity, setResultOpacity] = React.useState(0)

  React.useEffect(() => {
    if (resultImage && !isProcessing && stage === "idle") {
      runAnimationSequence()
    }
    
    if (!resultImage) {
      setStage("idle")
      setMaskProgress(0)
      setRevealProgress(0)
      setMaskOpacity(0)
      setOriginalOpacity(1)
      setResultOpacity(0)
    }
  }, [resultImage, isProcessing, stage])

  const runAnimationSequence = async () => {
    // Stage 1: Wipe in the raw mask (grayscale)
    setStage("mask")
    await animateValue(setMaskProgress, 0, 100, 800, "easeOut")
    await animateValue(setMaskOpacity, 0, 1, 400, "easeOut")
    await animateValue(setOriginalOpacity, 1, 0.15, 400, "easeOut")
    
    // Hold mask so user sees it clearly
    await sleep(500)
    
    // Stage 2: Result image (segmented) emerges THROUGH the mask
    // Original fades out, result fades in - both wiped by same progress
    setStage("reveal")
    await Promise.all([
      animateValue(setRevealProgress, 0, 100, 1200, "easeInOut"),
      animateValue(setMaskOpacity, 1, 0, 600, "easeOut"),
      animateValue(setOriginalOpacity, 0.15, 0, 800, "easeInOut"),
      animateValue(setResultOpacity, 0, 1, 800, "easeInOut"),
    ])
    
    // Complete - result stays at full opacity
    setStage("complete")
    onAnimationComplete?.()
  }

  const animateValue = (
    setter: (v: number) => void,
    from: number,
    to: number,
    duration: number,
    easing: "easeOut" | "easeInOut" | "easeIn" = "easeOut"
  ) => {
    return new Promise<void>((resolve) => {
      const start = performance.now()
      const animate = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        
        let easedT: number
        switch (easing) {
          case "easeOut":
            easedT = 1 - Math.pow(1 - t, 3)
            break
          case "easeInOut":
            easedT = t < 0.5 
              ? 2 * t * t 
              : 1 - Math.pow(-2 * t + 2, 2) / 2
            break
          case "easeIn":
            easedT = t * t
            break
          default:
            easedT = t
        }
        
        setter(from + (to - from) * easedT)
        
        if (t < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(animate)
    })
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  if (!originalImage) {
    return (
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted/30 border border-border">
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center p-6">
            <svg className="mx-auto w-12 h-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">Upload an image to begin segmentation</p>
          </div>
        </div>
      </div>
    )
  }

  const maskClipPath = `inset(0 ${100 - maskProgress}% 0 0)`
  const revealClipPath = `inset(0 ${100 - revealProgress}% 0 0)`

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted/30 border border-border">
      {/* 
        LAYER 1: Original image - fades out during reveal
      */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${originalImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: originalOpacity,
        }}
        aria-hidden="true"
      />

      {/* 
        LAYER 2: The Mask (binary, grayscale)
        Wipes in left-to-right. White = "keep this pixel", Black = "discard"
      */}
      {maskImage && (stage === "mask" || stage === "reveal") && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${maskImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            clipPath: stage === "mask" ? maskClipPath : revealClipPath,
            opacity: maskOpacity,
            filter: "grayscale(100%) contrast(150%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* 
        LAYER 3: The Result (segmented object on transparent)
        Wipes in left-to-right, replacing the original
      */}
      {resultImage && (stage === "reveal" || stage === "complete") && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${resultImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            clipPath: revealClipPath,
            opacity: resultOpacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* 
        VISUAL EXPLANATION: Mask as "window" concept
        During reveal, show a subtle mask outline to reinforce the concept
      */}
      {maskImage && stage === "reveal" && revealProgress > 10 && revealProgress < 90 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${maskImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            clipPath: revealClipPath,
            opacity: 0.15 * (1 - Math.abs(revealProgress - 50) / 50),
            filter: "grayscale(100%) contrast(200%)",
            mixBlendMode: "overlay",
          }}
          aria-hidden="true"
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path
                  className="animate-spin"
                  d="M12 2C12 2 12 2 12 2"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Running U-Net inference...</p>
            <p className="text-xs text-muted-foreground">Encoding → Bottleneck → Decoding</p>
          </div>
        </div>
      )}

      {/* Minimal Stage Indicator - just dots */}
      {(stage === "mask" || stage === "reveal") && !isProcessing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <div
            className="w-2 h-2 rounded-full bg-primary transition-opacity duration-300"
            style={{ opacity: stage === "mask" ? 1 : 0.3 }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary transition-opacity duration-300"
            style={{ opacity: stage === "reveal" ? 1 : 0.3 }}
          />
        </div>
      )}
    </div>
  )
}
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    const response = await fetch(`${backendUrl}/segment`, {
      method: "POST",
      body: backendFormData,
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Segmentation failed" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Segmentation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
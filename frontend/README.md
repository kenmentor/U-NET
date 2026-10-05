# Frontend - Pet Segmentation Web App

Next.js 14 React application for interactive pet image segmentation using the U-Net model.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **API Client**: Fetch API (native)

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Ensure the backend API is running at `http://localhost:8000` (or update `NEXT_PUBLIC_API_URL` in `.env.local`).

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/segment/       # API route proxy (optional)
│   ├── components/
│   │   ├── ui/                # Reusable UI components (Radix-based)
│   │   ├── header.tsx         # App header
│   │   ├── upload-area.tsx    # Drag-and-drop image upload
│   │   └── segmentation-viewer.tsx  # Results display
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
└── package.json
```

## Features

- Drag-and-drop image upload
- Real-time segmentation preview
- Multiple view modes:
  - Original image
  - Binary mask
  - Probability heatmap
  - Overlay composition
  - Segmented result
- Responsive design

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import in Vercel
3. Add `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

## API Integration

The frontend calls `POST /segment` on the backend with a multipart form containing the image file. Responses are base64-encoded PNG images displayed directly in the browser.
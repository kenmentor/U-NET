# U-Net Pet Segmentation

A complete end-to-end project for semantic segmentation of pets using U-Net architecture, featuring a PyTorch model, FastAPI backend, and Next.js frontend.

## Overview

This project implements a U-Net convolutional neural network for binary segmentation of pets from the Oxford-IIIT Pet Dataset. The model distinguishes pets from background, with a complete pipeline from training to deployment.

## Architecture

```
reinforcement-learning/
├── src/                    # Core ML code
│   ├── U_NET.py           # U-Net model architecture
│   ├── dataset.py         # Oxford-IIIT Pet dataset wrapper
│   └── train.py           # Training script
├── backend/               # FastAPI REST API
│   ├── main.py            # API server with /segment endpoint
│   ├── U_NET.py           # Model definition (API copy)
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js React application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── package.json       # Node dependencies
├── docs/
│   └── notebooks/         # Jupyter notebooks for experimentation
└── README.md
```

## Features

- **U-Net Architecture**: Encoder-decoder with skip connections for precise localization
- **Oxford-IIIT Pet Dataset**: 37 pet categories with pixel-level segmentation masks
- **FastAPI Backend**: REST API with `/segment` endpoint for inference
- **Next.js Frontend**: Interactive web UI for uploading images and viewing segmentations
- **Model Checkpointing**: Automatic saving during training with optimizer state

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- CUDA-capable GPU (recommended)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API runs at `http://localhost:8000`
- Health check: `GET /health`
- Segmentation: `POST /segment` (multipart/form-data with image file)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### Training

```bash
cd src
python train.py
```

Configuration in `train.py`:
- `learning_rate = 0.001`
- `epochs = 10`
- `batch_size = 32`
- Image size: 128x128

## Model Details

- **Architecture**: U-Net with 4 encoder/decoder blocks (64, 128, 256, 512 features)
- **Loss**: BCEWithLogitsLoss
- **Optimizer**: Adam
- **Input**: 3-channel RGB images (128x128)
- **Output**: Single-channel binary mask (pet vs background)
- **Dataset**: Oxford-IIIT Pet (trainval split, ~7349 images)

## API Usage

```bash
curl -X POST "http://localhost:8000/segment" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@pet_image.jpg"
```

Response includes base64-encoded:
- Original image
- Binary mask
- Probability mask
- Composited preview
- Segmented result

## Notebooks

Explore `docs/notebooks/` for:
- `U-NET.ipynb`: Model architecture visualization and inference examples
- `train_colab.ipynb`: Colab-ready training with progress tracking

## License

MIT License
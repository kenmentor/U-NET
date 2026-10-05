# Backend - FastAPI Segmentation API

REST API for U-Net pet segmentation model inference.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Server starts at `http://localhost:8000`

## Model Checkpoint

Place your trained model checkpoint at `backend/unet_checkpoint.pth` (or it will use the one from training).

The checkpoint should contain:
```python
{
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "epoch": epoch,
    "loss": loss_value
}
```

Or just the raw state_dict.

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "device": "cuda"  // or "cpu"
}
```

### Segment Image
```
POST /segment
Content-Type: multipart/form-data
```

Request: Image file (JPEG, PNG, etc.)

Response:
```json
{
  "original": "base64_encoded_original_image",
  "mask": "base64_encoded_binary_mask",
  "probability_mask": "base64_encoded_probability_map",
  "composed": "base64_encoded_preview_with_overlay",
  "result": "base64_encoded_segmented_result"
}
```

All images returned as base64-encoded PNG strings.

## Architecture

- **Framework**: FastAPI 0.109
- **ASGI Server**: Uvicorn 0.27
- **Model**: U-Net (PyTorch 2.2)
- **Image Processing**: Pillow, torchvision

## CORS

Configured for all origins (`*`) - adjust for production.

## Deployment

For production, consider:
- Gunicorn + Uvicorn workers
- Docker containerization
- Model optimization (ONNX, TensorRT)
- Rate limiting and authentication
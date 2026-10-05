import os
import sys
import io
import base64
import urllib.request
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import torch
import torch.nn.functional as F
from torchvision import transforms

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from U_NET import UNET

app = FastAPI(title="U-Net Segmentation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None

# Hugging Face Direct Download URL for your uploaded model
MODEL_URL = "https://huggingface.co/mentorcode/u-net/resolve/main/unet_checkpoint.pth"

def download_checkpoint_if_missing(checkpoint_path: str):
    if not os.path.exists(checkpoint_path):
        print(f"Checkpoint not found at {checkpoint_path}. Downloading from Hugging Face...")
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
            
            # Download file from Hugging Face
            urllib.request.urlretrieve(MODEL_URL, checkpoint_path)
            print("Download completed successfully!")
        except Exception as e:
            print(f"Error downloading checkpoint: {e}")
            raise RuntimeError(f"Failed to download model weights: {e}")

def load_model():
    global model
    if model is None:
        checkpoint_path = os.path.join(os.path.dirname(__file__), "unet_checkpoint.pth")
        
        # Download weights dynamically if missing
        download_checkpoint_if_missing(checkpoint_path)
        
        model = UNET(in_channels=3, out_channel=1).to(device)
        
        # Disable autograd globally during weight loading to save memory
        with torch.inference_mode():
            checkpoint = torch.load(checkpoint_path, map_location=device)
            if "model_state_dict" in checkpoint:
                model.load_state_dict(checkpoint["model_state_dict"])
            else:
                model.load_state_dict(checkpoint)
            model.eval()
            
    return model

transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "device": str(device)}

def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

@app.post("/segment")
async def segment_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        original_size = image.size

        input_tensor = transform(image).unsqueeze(0).to(device)

        model_instance = load_model()
        
        with torch.inference_mode():
            output = model_instance(input_tensor)
            output = torch.sigmoid(output)
            mask_prob = output.squeeze().cpu()
            output = (output > 0.5).float()

        output = F.interpolate(output, size=original_size[::-1], mode="bilinear", align_corners=False)
        mask = output.squeeze().cpu().numpy()

        # Raw mask (grayscale)
        mask_image = Image.fromarray((mask * 255).astype("uint8"), mode="L")
        mask_resized = mask_image.resize(original_size, Image.Resampling.LANCZOS)

        # Probability mask
        prob_mask = F.interpolate(mask_prob.unsqueeze(0).unsqueeze(0), size=original_size[::-1], mode="bilinear", align_corners=False)
        prob_np = prob_mask.squeeze().cpu().numpy()
        prob_image = Image.fromarray((prob_np * 255).astype("uint8"), mode="L")

        # Composited result
        mask_rgba = Image.new("RGBA", original_size, (0, 0, 0, 0))
        mask_rgba.putalpha(mask_resized)

        original_rgba = image.convert("RGBA")
        segmented = Image.alpha_composite(original_rgba, mask_rgba)

        # Colorized mask overlay
        color_overlay = Image.new("RGBA", original_size, (13, 148, 136, 0))
        color_overlay.putalpha(mask_resized)
        composed_preview = Image.alpha_composite(original_rgba, color_overlay)

        return JSONResponse({
            "original": image_to_base64(image),
            "mask": image_to_base64(mask_resized),
            "probability_mask": image_to_base64(prob_image),
            "composed": image_to_base64(composed_preview),
            "result": image_to_base64(segmented),
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
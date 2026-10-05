# Documentation & Notebooks

## Notebooks

### `U-NET.ipynb`
Interactive exploration of the U-Net architecture:
- Model architecture visualization
- Forward pass with shape verification
- Training loop with tqdm progress bars
- Checkpoint saving/loading
- Inference examples with matplotlib visualizations

### `train_colab.ipynb`
Colab-ready training notebook:
- Dataset preparation with torchvision transforms
- U-Net model definition
- Training loop with masked loss (ignores border pixels)
- Progress tracking with tqdm
- Automatic checkpoint saving
- Visualization of predictions vs ground truth

## Usage

Open in Jupyter:
```bash
jupyter notebook docs/notebooks/
```

Or upload to Google Colab for GPU training.

## Key Concepts

### Oxford-IIIT Pet Dataset
- 37 pet categories
- ~7,349 images with pixel-level segmentation masks
- Trimap masks: {1=Pet, 2=Background, 3=Border}
- Border pixels (class 3) are ignored in loss computation

### Loss Function
Uses masked BCEWithLogitsLoss:
```python
weight_mask = (y_batch != 3).float()  # Ignore border
loss = (BCEWithLogitsLoss(pred, target) * weight_mask).sum() / weight_mask.sum()
```

### Model Architecture
```
Input (3, 128, 128)
  ↓
Encoder: [64, 128, 256, 512] features
  ↓
Bottleneck: 1024 features
  ↓
Decoder with skip connections
  ↓
Output (1, 128, 128) - binary logits
```
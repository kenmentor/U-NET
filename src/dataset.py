import os
import numpy as np
import torch
import torchvision
import torchvision.transforms.v2 as transforms
from torch.utils.data import Dataset, DataLoader

def process_trimap(mask):
    """
    OxfordIIITPet returns PIL trimap masks with values {1, 2, 3}.
    Remaps to 0-indexed values:
        0: Pet (Foreground)
        1: Background
        2: Border / Contour
    Returns shape: [1, H, W] so Resize can process it.
    """
    mask = transforms.functional.to_image(mask)
    mask = mask.to(torch.long) - 1  # Convert {1, 2, 3} -> {0, 1, 2}
    return mask  # Keeps shape [1, H, W]


image_transform = transforms.Compose([
    transforms.ToImage(),
    transforms.ToDtype(torch.float32, scale=True),
    transforms.Resize((128, 128))
])

target_transform = transforms.Compose([
    process_trimap,
    transforms.Resize((128, 128), interpolation=transforms.InterpolationMode.NEAREST),
    # transforms.Lambda(lambda t: t.squeeze(0))  # Remove channel dim [1, 128, 128] -> [128, 128]
])


# 3. Custom Pet Dataset Wrapper
class PetDataset(Dataset):
    def __init__(self, root="./data", split="trainval", transform=image_transform, target_transform=target_transform):
        self.dataset = torchvision.datasets.OxfordIIITPet(
            root=root,
            split=split,
            target_types="segmentation",
            download=True,
            transform=transform,
            target_transform=target_transform
        )

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, index):
        return self.dataset[index]

    def get_batch(self, batch_num=6):
        images, masks = [], []
        idx = np.random.randint(low=0, high=len(self), size=batch_num)
        for index in idx:
            img, msk = self[index]
            images.append(img)
            masks.append(msk)
        return images, masks

    def get_data(self):
        return self.dataset


# 4. Execution
# if __name__ == "__main__":
#     dataset = PetDataset(
#         transform=image_transform,
#         target_transform=target_transform
#     )

#     loader = DataLoader(dataset, batch_size=32, shuffle=True)

#     for step, (images, masks) in enumerate(loader):
#         print(f"Batch {step}:")
#         print(f"  Images shape: {images.shape} | dtype: {images.dtype}")
#         print(f"  Masks shape:  {masks.shape}  | dtype: {masks.dtype}")
#         print(f"  Unique mask labels: {torch.unique(masks).tolist()}")
#         break
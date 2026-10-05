import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from dataset import PetDataset
from U_NET import UNET


def train_model(model, epochs, dataloader, optimizer, loss_function, device):
    model.to(device)
    loss_history = []

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct_pixels = 0
        total_pixels = 0

        for x_batch, y_batch in dataloader:
            x_batch = x_batch.to(device)
            y_batch = y_batch.to(device).float()
            optimizer.zero_grad()
            pred = model(x_batch)
            loss = loss_function(pred, y_batch)
            loss.backward()
            optimizer.step()


            batch_size = x_batch.size(0)
            running_loss += loss.item() * batch_size

            # Model outputs raw logits; threshold at 0.0 is equivalent to sigmoid >= 0.5
            predictions = (pred >= 0.0).float()
            correct_pixels += (predictions == y_batch).sum().item()
            total_pixels += y_batch.numel()

        # Compute epoch-level metrics
        epoch_loss = running_loss / len(dataloader.dataset)
        epoch_acc = (correct_pixels / total_pixels) * 100.0
        loss_history.append(epoch_loss)

        print(
            f"Epoch [{epoch + 1}/{epochs}] - Loss: {epoch_loss:.4f} | Pixel Acc: {epoch_acc:.2f}%"
        )

    return loss_history


if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    learning_rate = 0.001
    epochs = 10
    batch_size = 32

    dataset = PetDataset()
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = UNET()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    loss_function = nn.BCEWithLogitsLoss()

    train_model(
        model=model,
        epochs=epochs,
        dataloader=loader,
        optimizer=optimizer,
        loss_function=loss_function,
        device=device,
    )
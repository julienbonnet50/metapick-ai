import os
import sys
import random
import psycopg2
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from backend.src.utils.modelUtils import BattleDataset, BrawlerPredictionModel


# -------------------------------
# Step 1: Data Retrieval from SQL
# -------------------------------
def load_data():
    """
    Connects to the PostgreSQL database and fetches the battle data.
    Make sure to adjust credentials and paths as needed.
    """
    # Import your configuration (adjust as needed)
    sys.path.append(os.getcwd())
    try:
        import backend.src.config.AppConfig as AppConfig

        appConfig = AppConfig.AppConfig()
        password = appConfig.POSTGRE_SQL_PASSWORD
    except Exception as e:
        print("Error importing AppConfig. Using default password for demonstration.")
        password = "your_default_password"  # Replace with your password

    conn = psycopg2.connect(
        dbname="bs-project",
        user="postgres",
        password=password,
        host="localhost",
        port="5432",
    )

    query = "SELECT * FROM battles"
    df = pd.read_sql_query(query, conn)
    conn.close()
    print("DataFrame Retrieved:", df.shape)
    return df


# -------------------------------
# Step 2: Build Mappings for Encoding
# -------------------------------
def build_mappings(df):
    """
    Build dictionaries that map each brawler and map to an integer index.
    Assumes that brawlers in the teams are separated by '-' in the strings.
    """
    brawler_set = set()
    # Get brawlers from winning team column
    for team in df["wteam"]:
        for b in team.split("-"):
            brawler_set.add(b.strip())
    # Get brawlers from losing team column
    for team in df["lteam"]:
        for b in team.split("-"):
            brawler_set.add(b.strip())

    brawler_list = sorted(list(brawler_set))
    brawler_to_idx = {brawler: idx for idx, brawler in enumerate(brawler_list)}

    # Build map mapping from the "map" column
    map_set = set(df["map"].dropna().str.strip())
    map_list = sorted(list(map_set))
    map_to_idx = {m: idx for idx, m in enumerate(map_list)}

    print(f"Total unique brawlers: {len(brawler_to_idx)}, maps: {len(map_to_idx)}")
    return brawler_to_idx, map_to_idx


# -------------------------------
# Step 5: Training Loop
# -------------------------------
def train_model(
    model, dataloader, num_epochs=10, device="cpu", save_path="brawler_model.pth"
):
    model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    pad_idx = model.pad_idx

    for epoch in range(num_epochs):
        model.train()
        total_loss = 0.0
        for batch in dataloader:
            batch_size = batch["friend1"].shape[0]
            friends = torch.stack([batch["friend1"], batch["friend2"]], dim=1)
            enemies = torch.stack([batch["enemy1"], batch["enemy2"]], dim=1)

            pad_tensor = torch.full(
                (batch_size, 1), pad_idx, dtype=torch.long, device=device
            )
            friends = torch.cat([friends.to(device), pad_tensor], dim=1)
            enemies = torch.cat([enemies.to(device), pad_tensor], dim=1)
            map_idx = batch["map_idx"].unsqueeze(1).to(device)
            target = batch["target"].to(device)

            optimizer.zero_grad()
            logits = model(friends, enemies, map_idx)
            loss = criterion(logits, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}")

    # Save the trained model
    torch.save(model.state_dict(), save_path)
    print(f"Model saved to {save_path}")
    return model


# -------------------------------
# Step 6: Inference Function
# -------------------------------
def predict_best_brawler(
    model,
    friend_brawlers,
    enemy_brawlers,
    map_name,
    brawler_to_idx,
    map_to_idx,
    excluded_brawlers=None,
    device="cpu",
):
    """
    Predicts the top 10 best brawlers given a varying number of friends and enemies (0-3 each).

    Returns:
        top10_indices (list): List of the top 10 predicted brawler indices.
        top10_probs (list): List of corresponding probabilities for the top 10 predictions.
    """
    model.eval()
    with torch.no_grad():
        pad_idx = model.pad_idx  # Reserved index for padding

        # Convert names to indices (default to pad_idx if not found)
        friend_indices = [brawler_to_idx.get(b, pad_idx) for b in friend_brawlers]
        enemy_indices = [brawler_to_idx.get(b, pad_idx) for b in enemy_brawlers]

        # Pad to exactly 3 brawlers each
        while len(friend_indices) < 3:
            friend_indices.append(pad_idx)
        while len(enemy_indices) < 3:
            enemy_indices.append(pad_idx)

        # Convert lists to tensors with batch dimension 1
        friends = torch.tensor([friend_indices], dtype=torch.long).to(
            device
        )  # Shape: (1, 3)
        enemies = torch.tensor([enemy_indices], dtype=torch.long).to(
            device
        )  # Shape: (1, 3)
        map_idx = torch.tensor([[map_to_idx.get(map_name, 0)]], dtype=torch.long).to(
            device
        )  # Shape: (1, 1)

        # Model prediction
        logits = model(friends, enemies, map_idx)

        # Mask excluded brawlers if provided
        if excluded_brawlers:
            for banned in excluded_brawlers:
                if banned in brawler_to_idx:
                    logits[0, brawler_to_idx[banned]] = (
                        -1e9
                    )  # Large negative value to exclude

        # Compute probabilities
        probs = F.softmax(logits, dim=1)

        # Get the top 10 predictions
        topk = torch.topk(probs, k=10, dim=1)
        top10_indices = topk.indices.squeeze(0).tolist()  # List of top 10 indices
        top10_probs = topk.values.squeeze(0).tolist()  # Corresponding probabilities

    return top10_indices, top10_probs


import pickle  # To save/load mappings and dataset


# -------------------------------
# Save & Load Functions for Mappings and Dataset
# -------------------------------
def save_mappings_and_dataset(brawler_to_idx, map_to_idx, dataset, path="data.pkl"):
    """Saves brawler mappings, map mappings, and dataset samples."""
    data = {
        "brawler_to_idx": brawler_to_idx,
        "map_to_idx": map_to_idx,
        "dataset_samples": dataset.samples,  # Save processed dataset samples
    }
    with open(path, "wb") as f:
        pickle.dump(data, f)
    print(f"Mappings & dataset saved to {path}")


def load_mappings_and_dataset(path="data.pkl"):
    """Loads brawler mappings, map mappings, and dataset samples if available."""
    if os.path.exists(path):
        with open(path, "rb") as f:
            data = pickle.load(f)
        print(f"Loaded mappings & dataset from {path}")
        return data["brawler_to_idx"], data["map_to_idx"], data["dataset_samples"]
    return None, None, None


# -------------------------------
# Main Function to Run the Pipeline
# -------------------------------
def main():
    data_path = "data/model/data_all.pkl"  # File to store mappings and dataset
    model_path = "data/model/nn_model_all.pth"  # File to store trained model

    # Try loading saved mappings & dataset
    brawler_to_idx, map_to_idx, dataset_samples = load_mappings_and_dataset(data_path)

    if brawler_to_idx is None or map_to_idx is None or dataset_samples is None:
        print("Loading data from SQL (first time)...")
        df = load_data()  # Load data only if needed
        brawler_to_idx, map_to_idx = build_mappings(df)
        dataset = BattleDataset(df, brawler_to_idx, map_to_idx)
        save_mappings_and_dataset(brawler_to_idx, map_to_idx, dataset, data_path)
    else:
        print("Skipping SQL load, using saved dataset.")
        dataset = BattleDataset.__new__(BattleDataset)  # Create empty instance
        dataset.samples = dataset_samples  # Assign preprocessed samples

    num_brawlers = len(brawler_to_idx)
    num_maps = len(map_to_idx)
    dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

    model = BrawlerPredictionModel(
        num_brawlers=num_brawlers, num_maps=num_maps, emb_dim=16, hidden_dim=64
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load or train model
    if os.path.exists(model_path):
        print("Loading saved model...")
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
    else:
        print("Training model...")
        model = train_model(
            model, dataloader, num_epochs=10, device=device, save_path=model_path
        )

    # Inference example
    friend_brawlers = ["CARL", "GUS"]
    enemy_brawlers = ["SURGE", "BARLEY"]
    excluded = ["SURGE", "TARA", "STU", "PENNY", "SPIKE"]
    map_name = "Double Swoosh"
    idx_to_brawler = {idx: brawler for brawler, idx in brawler_to_idx.items()}

    print(
        f"Predicting best brawler for {friend_brawlers} vs {enemy_brawlers} on {map_name}"
    )
    print(f"with banned brawler {excluded}")
    top10_indices, top10_probs = predict_best_brawler(
        model,
        friend_brawlers,
        enemy_brawlers,
        map_name,
        brawler_to_idx,
        map_to_idx,
        excluded_brawlers=excluded,
        device=device,
    )

    print(f"Top 10 predicted brawlers for map {map_name}:")
    for idx, prob in zip(top10_indices, top10_probs):
        print(f"{idx_to_brawler[idx]}: {prob:.4f}")


if __name__ == "__main__":
    main()

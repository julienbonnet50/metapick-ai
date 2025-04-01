from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import logging
import sys
import os

from matplotlib import pyplot as plt

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
import random
import pickle
import psycopg2
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm

from src.utils.modelUtils import BattleDataset, BrawlerPredictionModel


class NeuralNetworkService:
    def __init__(
        self,
        appConfig=None,
        data_path="",
        model_path="",
        device=None,
        version="35",
        auto_load_enable=True,
    ):
        self.data_path = data_path
        self.model_path = model_path
        self.counter_matrix_path = self.model_path.replace(
            "nn_model_all.pth", "counter_matrix.pkl"
        )
        self.plot_path = self.model_path.replace(
            "nn_model_all.pth", "training_loss_plot.png"
        )
        self.appConfig = appConfig
        self.version = version
        self.auto_load_enable = auto_load_enable
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        self.brawler_to_idx = None
        self.map_to_idx = None
        self.dataset = None
        self.model = None
        self.counter_matrix = None

        self.load_data()

        if auto_load_enable:
            self.load_model()
            self.load_counter_matrix()

    def setVersion(self, version):
        self.version = version

        # Example: Pad missing friends and enemies in the dataset

    def prepare_dataset(self, df, num_friends=3, num_enemies=3, pad_idx=0):
        # Ensure the required columns exist
        for i in range(1, num_friends + 1):
            if f"friend{i}" not in df.columns:
                df[f"friend{i}"] = pad_idx  # Pad missing friends with pad_idx

        for i in range(1, num_enemies + 1):
            if f"enemy{i}" not in df.columns:
                df[f"enemy{i}"] = pad_idx  # Pad missing enemies with pad_idx

        return df

    def load_data(self):
        print(f"Loading data locally at path : {self.data_path}")
        if os.path.exists(self.data_path) and self.auto_load_enable == True:
            print("Loading mappings from file...")
            self.load_mappings(self.data_path)
        else:
            print("Data not found locally")
            print("Loading data from SQL DB...")
            df = self.fetch_battle_data()
            df = self.prepare_dataset(df, num_friends=3, num_enemies=3, pad_idx=0)
            self.brawler_to_idx, self.map_to_idx = self.build_mappings(df)
            self.dataset = BattleDataset(df, self.brawler_to_idx, self.map_to_idx)
            self.save_mappings(self.data_path)

    def fetch_stats_battle_data(self):
        query = """
            WITH battle_data AS (
                SELECT
                    id,
                    timestamp,
                    map,
                    mode,
                    avg_rank,
                    unnest(string_to_array(wTeam, '-')) AS brawler,
                    'Victory' AS result
                FROM battles_s35_3
                WHERE avg_rank > 15
                UNION ALL
                SELECT
                    id,
                    timestamp,
                    map,
                    mode,
                    avg_rank,
                    unnest(string_to_array(lTeam, '-')) AS brawler,
                    'Defeat' AS result
                FROM battles_s35_3
                WHERE avg_rank > 15
            ),
            brawler_stats AS (
                SELECT
                    brawler,
                    map,
                    SUM(CASE WHEN result = 'Victory' THEN 1 ELSE 0 END) AS wins,
                    SUM(CASE WHEN result = 'Defeat' THEN 1 ELSE 0 END) AS losses
                FROM battle_data
                GROUP BY brawler, map
            )
            SELECT
                brawler,
                map,
                wins,
                losses,
                (wins + losses) AS total_matches,
                (wins::FLOAT / NULLIF(wins + losses, 0)) * 100 AS win_rate,
                (wins + losses)::FLOAT / (SELECT COUNT(*) * 6 FROM battles_s35_3 WHERE avg_rank > 15) * 100 AS usage_rate
            FROM brawler_stats
            ORDER BY map, win_rate DESC;
        """
        conn = psycopg2.connect(
            dbname="bs-project",
            user="postgres",
            password=self.appConfig.POSTGRE_SQL_PASSWORD,
            host="localhost",
            port="5432",
        )
        if conn is None:
            raise ConnectionError("Could not connect to database.")
        df = pd.read_sql_query(query, conn)
        print("DataFrame Retrieved : ", df.count)
        conn.close()
        return df

    def save_stats_battle(self, path):
        print("Get stats from SQL DB...")
        df = self.fetch_stats_battle_data()
        print("Saving stats to file...")
        df.to_pickle(path)

    def fetch_battle_data(self):
        conn = psycopg2.connect(
            dbname="bs-project",
            user="postgres",
            password=self.appConfig.POSTGRE_SQL_PASSWORD,
            host="localhost",
            port="5432",
        )
        if conn is None:
            raise ConnectionError("Could not connect to database.")
        df = pd.read_sql_query(f"SELECT * FROM battles_s{self.version}", conn)
        print("DataFrame Retrieved : ", df.count)
        conn.close()
        return df

    def idx_to_brawler(self, idx):
        return {i: b for b, i in self.brawler_to_idx.items()}.get(idx, "Unknown")

    def build_mappings(self, df):
        print("Building mappings...")
        brawler_set = set()
        for team in df["wteam"].str.split("-").dropna():
            brawler_set.update(team)
        for team in df["lteam"].str.split("-").dropna():
            brawler_set.update(team)

        brawler_to_idx = {b: i for i, b in enumerate(sorted(brawler_set))}
        map_to_idx = {m: i for i, m in enumerate(sorted(df["map"].dropna().unique()))}
        return brawler_to_idx, map_to_idx

    def load_mappings(self, path):
        # Check if the file exists before attempting to load
        if not os.path.exists(path):
            raise FileNotFoundError(f"The file at {path} does not exist.")

        with open(path, "rb") as f:
            dataMappings = pickle.load(f)

        print("Loaded mappings from file...")
        # Assuming the loaded dictionary has the same structure
        self.brawler_to_idx = dataMappings.get("brawler_to_idx")
        self.map_to_idx = dataMappings.get("map_to_idx")

    def save_mappings(self, path):
        dataMappings = {
            "brawler_to_idx": self.brawler_to_idx,
            "map_to_idx": self.map_to_idx,
        }
        # Ensure the directory exists
        directory = os.path.dirname(path)
        if not os.path.exists(directory):
            os.makedirs(directory)

        print("Saving mappings to file at path :", path)
        with open(path, "wb") as f:
            pickle.dump(dataMappings, f)

    def load_model(self, num_friends=3, num_enemies=3):
        print("Loading model...")
        num_brawlers = len(self.brawler_to_idx)
        num_maps = len(self.map_to_idx)

        # Initialize the updated model with the correct number of friends and enemies
        self.model = BrawlerPredictionModel(
            num_brawlers=num_brawlers,
            num_maps=num_maps,
            num_friends=num_friends,
            num_enemies=num_enemies,
        )

        # Load model weights if they exist
        if os.path.exists(self.model_path):
            print(f"Found existing model at path '{self.model_path}'")
            self.model.load_state_dict(
                torch.load(self.model_path, map_location=self.device)
            )
        else:
            print(f"Model not found at path '{self.model_path}'")
            raise FileNotFoundError(f"Model not found at path '{self.model_path}'")
        self.model.to(self.device)

    def load_counter_matrix(self):
        print("Loading counter matrix...")

        if os.path.exists(self.counter_matrix_path):
            print(f"Found existing counter matrix at '{self.counter_matrix_path}'")

            try:
                with open(self.counter_matrix_path, "rb") as f:
                    self.counter_matrix = pickle.load(f)  # Load using pickle

                # Ensure the matrix is moved to the correct device
                self.counter_matrix = self.counter_matrix.clone().detach().to(self.device)

                print("Counter matrix loaded successfully.")

            except (pickle.UnpicklingError, EOFError) as e:
                print(f"Error loading counter matrix: {e}")
                print("Ensure the pickle file is valid and was correctly saved.")

        else:
            print(f"Counter matrix not found at '{self.counter_matrix_path}'")

    def initialize_model(self, num_brawlers, num_maps, emb_dim=16, hidden_dim=64):
        """Initialize the BrawlerPredictionModel with the correct parameters"""
        print(f"Initializing model with {num_brawlers} brawlers and {num_maps} maps...")
        self.model = BrawlerPredictionModel(
            num_brawlers=num_brawlers,
            num_maps=num_maps,
            emb_dim=emb_dim,
            hidden_dim=hidden_dim,
        ).to(self.device)
        print("Model initialized successfully")
        return self.model

    def train_model(
        self,
        num_epochs=10,
        batch_size=64,
        num_friends=3,
        num_enemies=3,
        val_split=0.1,
        patience=5,
    ):
        """
        Train the model.

        Args:
            num_epochs (int): Number of training epochs
            batch_size (int): Batch size
            num_friends (int): Number of friend brawlers
            num_enemies (int): Number of enemy brawlers
            val_split (float): Validation split ratio
            patience (int): Early stopping patience
        """
        # Ensure we have mappings
        if self.brawler_to_idx is None or self.map_to_idx is None:
            raise ValueError(
                "Mappings not initialized. Please load or build mappings before training."
            )

        # Ensure model is initialized
        if self.model is None:
            print("Model is not initialized. Initializing model...")
            self.initialize_model(
                num_brawlers=len(self.brawler_to_idx), num_maps=len(self.map_to_idx)
            )

        print("Preparing for training...")

        # Create validation split
        dataset_size = len(self.dataset)
        val_size = int(val_split * dataset_size)
        train_size = dataset_size - val_size
        train_dataset, val_dataset = torch.utils.data.random_split(
            self.dataset, [train_size, val_size]
        )

        # Create dataloaders
        train_dataloader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True
        )
        val_dataloader = DataLoader(val_dataset, batch_size=batch_size)

        # Optimizer and scheduler
        optimizer = torch.optim.Adam(
            self.model.parameters(), lr=1e-3, weight_decay=1e-5
        )
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", factor=0.5, patience=2
        )
        criterion = nn.CrossEntropyLoss()

        # For mixed precision training
        scaler = torch.amp.GradScaler("cuda")

        # For early stopping
        best_val_loss = float("inf")
        patience_counter = 0

        # For tracking metrics
        train_losses = []
        val_losses = []

        print(f"Starting training for {num_epochs} epochs...")

        for epoch in range(num_epochs):
            # Training phase
            self.model.train()
            total_train_loss = 0.0

            train_progress = tqdm(
                train_dataloader, desc=f"Epoch {epoch+1}/{num_epochs}"
            )
            for batch in train_progress:
                # Stack friends and enemies into tensors
                friends = torch.stack(
                    [batch[f"friend{i+1}"] for i in range(num_friends)], dim=1
                ).to(self.device)
                enemies = torch.stack(
                    [batch[f"enemy{i+1}"] for i in range(num_enemies)], dim=1
                ).to(self.device)
                map_idx = batch["map_idx"].unsqueeze(1).to(self.device)
                target = batch["target"].to(self.device)

                # Zero gradients
                optimizer.zero_grad()

                # Mixed precision forward pass
                with torch.amp.autocast("cuda"):
                    logits = self.model(friends, enemies, map_idx)
                    loss = criterion(logits, target)

                # Backward pass with scaling
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                # Track loss
                total_train_loss += loss.item()
                train_progress.set_postfix(loss=loss.item())

            avg_train_loss = total_train_loss / len(train_dataloader)
            train_losses.append(avg_train_loss)

            # Validation phase
            self.model.eval()
            total_val_loss = 0.0

            with torch.no_grad():
                val_progress = tqdm(val_dataloader, desc="Validation")
                for batch in val_progress:
                    # Stack friends and enemies into tensors
                    friends = torch.stack(
                        [batch[f"friend{i+1}"] for i in range(num_friends)], dim=1
                    ).to(self.device)
                    enemies = torch.stack(
                        [batch[f"enemy{i+1}"] for i in range(num_enemies)], dim=1
                    ).to(self.device)
                    map_idx = batch["map_idx"].unsqueeze(1).to(self.device)
                    target = batch["target"].to(self.device)

                    # Forward pass
                    logits = self.model(friends, enemies, map_idx)
                    loss = criterion(logits, target)

                    # Track loss
                    total_val_loss += loss.item()
                    val_progress.set_postfix(loss=loss.item())

            avg_val_loss = total_val_loss / len(val_dataloader)
            val_losses.append(avg_val_loss)

            # Update learning rate scheduler
            scheduler.step(avg_val_loss)

            print(
                f"Epoch {epoch+1} completed - Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}"
            )

            # Early stopping check
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                patience_counter = 0
                torch.save(self.model.state_dict(), self.model_path)
                print(f"New best model saved with validation loss: {best_val_loss:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping triggered after {epoch+1} epochs")
                    break

        print(f"Training complete. Final best validation loss: {best_val_loss:.4f}")

        if self.appConfig.MODE == "IMPORT":
            # Plot training curves
            plt.figure(figsize=(10, 5))
            plt.plot(train_losses, label="Training Loss")
            plt.plot(val_losses, label="Validation Loss")
            plt.title("Training and Validation Loss")
            plt.xlabel("Epoch")
            plt.ylabel("Loss")
            plt.legend()
            plt.savefig(self.plot_path)
            plt.close()

    def train_model2(
        self,
        num_epochs=10,
        batch_size=64,
        num_friends=3,
        num_enemies=3,
        val_split=0.1,
        patience=5,
    ):
        # Ensure we have mappings
        if self.brawler_to_idx is None or self.map_to_idx is None:
            raise ValueError(
                "Mappings not initialized. Please load or build mappings before training."
            )

        # Ensure model is initialized
        if self.model is None:
            print("Model is not initialized. Initializing model...")
            self.initialize_model(
                num_brawlers=len(self.brawler_to_idx), num_maps=len(self.map_to_idx)
            )

        print("Preparing for training...")

        # Create validation split
        dataset_size = len(self.dataset)
        val_size = int(val_split * dataset_size)
        train_size = dataset_size - val_size
        train_dataset, val_dataset = torch.utils.data.random_split(
            self.dataset, [train_size, val_size]
        )

        # Create dataloaders
        train_dataloader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True
        )
        val_dataloader = DataLoader(val_dataset, batch_size=batch_size)

        # Optimizer and scheduler
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", factor=0.5, patience=2
        )
        criterion = nn.CrossEntropyLoss()

        # For mixed precision training
        scaler = torch.cuda.amp.GradScaler()

        # For early stopping
        best_val_loss = float("inf")
        patience_counter = 0

        print(f"Starting training for {num_epochs} epochs...")

        for epoch in range(num_epochs):
            # Training phase
            self.model.train()
            total_train_loss = 0.0

            train_progress = tqdm(
                train_dataloader, desc=f"Epoch {epoch+1}/{num_epochs}"
            )
            for batch in train_progress:
                # Stack friends and enemies into tensors
                friends = torch.stack(
                    [batch[f"friend{i+1}"] for i in range(num_friends)], dim=1
                ).to(self.device)
                enemies = torch.stack(
                    [batch[f"enemy{i+1}"] for i in range(num_enemies)], dim=1
                ).to(self.device)
                map_idx = batch["map_idx"].unsqueeze(1).to(self.device)
                target = batch["target"].to(self.device)

                # Zero gradients
                optimizer.zero_grad()

                # Mixed precision forward pass
                with torch.amp.autocast("cuda"):
                    logits = self.model(friends, enemies, map_idx)
                    loss = criterion(logits, target)

                # Backward pass with scaling
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                # Track loss
                total_train_loss += loss.item()
                train_progress.set_postfix(loss=loss.item())

            avg_train_loss = total_train_loss / len(train_dataloader)

            # Validation phase
            self.model.eval()
            total_val_loss = 0.0

            with torch.no_grad():
                val_progress = tqdm(val_dataloader, desc="Validation")
                for batch in val_progress:
                    # Stack friends and enemies into tensors
                    friends = torch.stack(
                        [batch[f"friend{i+1}"] for i in range(num_friends)], dim=1
                    ).to(self.device)
                    enemies = torch.stack(
                        [batch[f"enemy{i+1}"] for i in range(num_enemies)], dim=1
                    ).to(self.device)
                    map_idx = batch["map_idx"].unsqueeze(1).to(self.device)
                    target = batch["target"].to(self.device)

                    # Forward pass
                    logits = self.model(friends, enemies, map_idx)
                    loss = criterion(logits, target)

                    # Track loss
                    total_val_loss += loss.item()
                    val_progress.set_postfix(loss=loss.item())

            avg_val_loss = total_val_loss / len(val_dataloader)

            # Update learning rate scheduler
            scheduler.step(avg_val_loss)

            print(
                f"Epoch {epoch+1} completed - Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}"
            )

            # Early stopping check
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                patience_counter = 0
                torch.save(self.model.state_dict(), self.model_path)
                print(f"New best model saved with validation loss: {best_val_loss:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping triggered after {epoch+1} epochs")
                    break

        print(f"Training complete. Final best validation loss: {best_val_loss:.4f}")

    def predict_winrate(self, friends, enemies, map_name):
        """
        Predict the win rate for a team of friends against a team of enemies on a specific map.

        Args:
            friends (list): List of friend brawler names.
            enemies (list): List of enemy brawler names.
            map_name (str): Name of the map.

        Returns:
            float: Estimated win rate percentage (0-100).
        """
        self.model.eval()
        pad_idx = self.model.pad_idx

        # Convert brawler names to indices
        friend_indices = [self.brawler_to_idx.get(b, pad_idx) for b in friends]
        enemy_indices = [self.brawler_to_idx.get(b, pad_idx) for b in enemies]

        # Ensure proper padding
        friend_indices += [pad_idx] * (self.model.num_friends - len(friend_indices))
        enemy_indices += [pad_idx] * (self.model.num_enemies - len(enemy_indices))

        # Convert inputs to tensors and move to device
        map_idx = torch.tensor(
            [[self.map_to_idx.get(map_name, 0)]], dtype=torch.long, device=self.device
        )
        friends_tensor = torch.tensor(
            [friend_indices], dtype=torch.long, device=self.device
        )
        enemies_tensor = torch.tensor(
            [enemy_indices], dtype=torch.long, device=self.device
        )

        # Make predictions
        with torch.no_grad():
            logits = self.model(
                friends_tensor, enemies_tensor, map_idx
            )  # Shape: (1, num_brawlers)
            mirror_logits = self.model(enemies_tensor, friends_tensor, map_idx)

            # Normalize logits using softmax
            probabilities = torch.softmax(logits, dim=1)
            mirror_probabilities = torch.softmax(mirror_logits, dim=1)

            # Extract friend and enemy scores
            friend_scores = (
                probabilities[0, friend_indices].mean().item()
            )  # Averaging instead of summing
            enemy_scores = mirror_probabilities[0, enemy_indices].mean().item()

            # Compute relative strength
            relative_strength = friend_scores - enemy_scores

            # Apply a calibrated sigmoid function
            scale = 5  # Tune this parameter based on validation data
            win_rate = (
                100
                * (
                    1
                    / (
                        1
                        + torch.exp(
                            torch.tensor(-relative_strength * scale, device=self.device)
                        )
                    )
                ).item()
            )

        return round(win_rate, 2)

    def predict_best_brawler(
        self,
        friends,
        enemies,
        map_name,
        excluded=[],
        nbBrawlers=10,
        available_brawlers=[],
    ):
        """
        Predict the best brawler choices with explicit counter relationship handling.

        Args:
            friends (list): List of friend brawler names
            enemies (list): List of enemy brawler names
            map_name (str): Name of the map
            excluded (list): List of brawlers to exclude from predictions
            nbBrawlers (int): Number of top brawlers to return
            available_brawlers (list): List of brawlers to consider (if empty, consider all)

        Returns:
            list: List of tuples (brawler_name, win_rate) sorted by win rate
        """
        self.model.eval()
        pad_idx = self.model.pad_idx

        # Convert brawler names to indices
        friend_indices = [self.brawler_to_idx.get(b, pad_idx) for b in friends]
        enemy_indices = [self.brawler_to_idx.get(b, pad_idx) for b in enemies]

        # Pad friends and enemies to match the model's expected input size
        while len(friend_indices) < self.model.num_friends:
            friend_indices.append(pad_idx)
        while len(enemy_indices) < self.model.num_enemies:
            enemy_indices.append(pad_idx)

        # Convert to tensors and move to the correct device
        map_idx = torch.tensor(
            [[self.map_to_idx.get(map_name, 0)]], dtype=torch.long
        ).to(self.device)
        friends_tensor = torch.tensor([friend_indices], dtype=torch.long).to(
            self.device
        )
        enemies_tensor = torch.tensor([enemy_indices], dtype=torch.long).to(self.device)

        # Combine already picked and explicitly excluded brawlers
        all_excluded = excluded.copy()
        all_excluded.extend(friends)
        all_excluded.extend(enemies)

        # Make predictions
        with torch.no_grad():
            # Get raw logits from the model
            logits = self.model(friends_tensor, enemies_tensor, map_idx)

            # Create a baseline score from the model output
            base_scores = F.softmax(logits, dim=1)

            # Create a counter boost matrix - this will directly boost counter picks
            counter_boost = torch.zeros_like(base_scores)

            # For each enemy, find brawlers that counter them and boost their scores
            counter_strength = (
                2.0  # How strongly to boost counter picks (adjust as needed)
            )

            for enemy in enemies:
                if enemy in self.brawler_to_idx:
                    enemy_idx = self.brawler_to_idx[enemy]

                    # Apply counter relationships - using a counter matrix or function
                    # This is where we explicitly boost counter picks
                    for brawler_idx in range(len(self.brawler_to_idx)):
                        # Get counter relationship (how well brawler_idx counters this enemy)
                        counter_value = self.get_counter_strength(
                            brawler_idx, enemy_idx
                        )

                        # Boost the score for strong counters
                        if counter_value > 0.5:  # This is a strong counter
                            counter_boost[0, brawler_idx] += (
                                counter_value * counter_strength
                            )

            # Combine base scores with counter boosts
            combined_scores = base_scores + counter_boost

            # Filter excluded and unavailable brawlers
            win_rate_scores = torch.zeros_like(combined_scores)

            if available_brawlers:
                # Only set scores for brawlers in available_brawlers and not in excluded
                for brawler_name in available_brawlers:
                    if (
                        brawler_name in self.brawler_to_idx
                        and brawler_name not in all_excluded
                    ):
                        idx = self.brawler_to_idx[brawler_name]
                        win_rate_scores[0, idx] = combined_scores[0, idx]
            else:
                # If no available_brawlers provided, use all except excluded
                win_rate_scores = combined_scores.clone()
                for b in all_excluded:
                    if b in self.brawler_to_idx:
                        win_rate_scores[0, self.brawler_to_idx[b]] = 0.0

            # Normalize to sum to 1 (optional)
            total = win_rate_scores.sum()
            if total > 0:
                win_rate_scores = win_rate_scores / total

            # Get the number of brawlers with non-zero scores
            non_zero_count = (win_rate_scores > 0).sum().item()
            k = min(nbBrawlers, non_zero_count)

            if k > 0:
                # Get top-k brawlers
                topk = torch.topk(win_rate_scores, k=k, dim=1)

                # Convert to win rate percentages (0-100%)
                win_rates = [
                    (self.idx_to_brawler(idx), float(prob * 100))
                    for idx, prob in zip(
                        topk.indices.squeeze(0).tolist(),
                        topk.values.squeeze(0).tolist(),
                    )
                    if prob > 0
                ]  # Only include brawlers with non-zero probability
            else:
                win_rates = []

            return win_rates

    def save_counter_matrix(self):
        """
        Build a counter relationship matrix for brawlers with multi-threading and progress tracking.
        """
        print("Start saving counter matrix...")
        num_brawlers = len(self.brawler_to_idx)
        print(f"Number of brawlers: {num_brawlers}")

        counter_matrix = torch.zeros((num_brawlers, num_brawlers), device=self.device)

        if not hasattr(self, "dataset") or self.dataset is None:
            print("No dataset found. Exiting function.")
            return

        print("Dataset found, processing matchups in parallel...")

        matchup_counts = {}
        matchup_wins = {}

        def process_data_point(data_point):
            """Process a single data point and return the results"""
            try:
                friends = [
                    data_point[f"friend{i+1}"] for i in range(self.model.num_friends)
                ]
                enemies = [
                    data_point[f"enemy{i+1}"] for i in range(self.model.num_enemies)
                ]

                # Determine winner
                if "target" in data_point:
                    target_brawler = data_point["target"]
                    winner = 1 if target_brawler in friends else 0
                elif "win" in data_point:
                    winner = 1 if data_point["win"] else 0
                elif "victory" in data_point:
                    winner = 1 if data_point["victory"] else 0
                else:
                    return None  # Skip if we can't determine the winner

                local_matchup_counts = {}
                local_matchup_wins = {}

                for friend in friends:
                    for enemy in enemies:
                        key = (friend, enemy)
                        local_matchup_counts[key] = local_matchup_counts.get(key, 0) + 1
                        if winner == 1:
                            local_matchup_wins[key] = local_matchup_wins.get(key, 0) + 1

                return local_matchup_counts, local_matchup_wins

            except KeyError as e:
                return f"Skipping data point due to missing key: {e}"

        # Process dataset in parallel with tqdm progress tracking
        with ThreadPoolExecutor() as executor:
            future_to_data = {
                executor.submit(process_data_point, data): data for data in self.dataset
            }

            with tqdm(
                total=len(self.dataset), desc="Processing Matchups", unit=" match"
            ) as pbar:
                for future in as_completed(future_to_data):
                    result = future.result()
                    pbar.update(1)  # Update progress bar

                    if isinstance(result, str):  # If error message was returned
                        print(result)
                    elif result is not None:
                        local_counts, local_wins = result
                        for key, value in local_counts.items():
                            matchup_counts[key] = matchup_counts.get(key, 0) + value
                        for key, value in local_wins.items():
                            matchup_wins[key] = matchup_wins.get(key, 0) + value

        print("Finished processing dataset. Calculating counter strengths...")

        with tqdm(
            total=len(matchup_counts),
            desc="Calculating Counter Strengths",
            unit=" pair",
        ) as pbar:
            for (friend, enemy), count in matchup_counts.items():
                if count >= 10:  # Only consider matchups with enough data
                    win_rate = matchup_wins.get((friend, enemy), 0) / count
                    counter_strength = (
                        win_rate - 0.5
                    ) * 2  # Rescale from [0.5, 1.0] to [0, 1.0]
                    counter_strength = max(0, counter_strength)  # Ensure non-negative
                    counter_matrix[friend, enemy] = counter_strength
                    pbar.update(1)  # Update progress bar

        counter_matrix = counter_matrix * 0.8 + 0.1

        try:
            counter_matrix_cpu = counter_matrix.cpu()
            with open(self.counter_matrix_path, "wb") as f:
                pickle.dump(counter_matrix_cpu, f)
            print(f"Counter matrix saved successfully at {self.counter_matrix_path}")
        except Exception as e:
            print(f"Error saving counter matrix: {e}")
            """
            Build a counter relationship matrix for brawlers with multi-threading.
            """
            print("Start saving counter matrix...")
            num_brawlers = len(self.brawler_to_idx)
            print(f"Number of brawlers: {num_brawlers}")

            counter_matrix = torch.zeros(
                (num_brawlers, num_brawlers), device=self.device
            )

            if not hasattr(self, "dataset") or self.dataset is None:
                print("No dataset found. Exiting function.")
                return

            print("Dataset found, processing matchups in parallel...")

            matchup_counts = {}
            matchup_wins = {}

            def process_data_point(data_point):
                """Process a single data point and return the results"""
                try:
                    friends = [
                        data_point[f"friend{i+1}"]
                        for i in range(self.model.num_friends)
                    ]
                    enemies = [
                        data_point[f"enemy{i+1}"] for i in range(self.model.num_enemies)
                    ]

                    # Determine winner
                    if "target" in data_point:
                        target_brawler = data_point["target"]
                        winner = 1 if target_brawler in friends else 0
                    elif "win" in data_point:
                        winner = 1 if data_point["win"] else 0
                    elif "victory" in data_point:
                        winner = 1 if data_point["victory"] else 0
                    else:
                        return None  # Skip if we can't determine the winner

                    local_matchup_counts = {}
                    local_matchup_wins = {}

                    for friend in friends:
                        for enemy in enemies:
                            key = (friend, enemy)
                            local_matchup_counts[key] = (
                                local_matchup_counts.get(key, 0) + 1
                            )
                            if winner == 1:
                                local_matchup_wins[key] = (
                                    local_matchup_wins.get(key, 0) + 1
                                )

                    return local_matchup_counts, local_matchup_wins

                except KeyError as e:
                    print(f"Skipping data point due to missing key: {e}")
                    return None

            # Process dataset in parallel
            with ThreadPoolExecutor() as executor:
                future_to_data = {
                    executor.submit(process_data_point, data): data
                    for data in self.dataset
                }
                for future in as_completed(future_to_data):
                    result = future.result()
                    if result is not None:
                        local_counts, local_wins = result
                        for key, value in local_counts.items():
                            matchup_counts[key] = matchup_counts.get(key, 0) + value
                        for key, value in local_wins.items():
                            matchup_wins[key] = matchup_wins.get(key, 0) + value

            print("Finished processing dataset. Calculating counter strengths...")

            for (friend, enemy), count in matchup_counts.items():
                if count >= 10:  # Only consider matchups with enough data
                    win_rate = matchup_wins.get((friend, enemy), 0) / count
                    counter_strength = (
                        win_rate - 0.5
                    ) * 2  # Rescale from [0.5, 1.0] to [0, 1.0]
                    counter_strength = max(0, counter_strength)  # Ensure non-negative
                    counter_matrix[friend, enemy] = counter_strength
                    print(
                        f"Set counter strength for ({friend}, {enemy}): {counter_strength:.4f}"
                    )

            counter_matrix = counter_matrix * 0.8 + 0.1

            try:
                counter_matrix_cpu = counter_matrix.cpu()
                with open(self.counter_matrix_path, "wb") as f:
                    pickle.dump(counter_matrix_cpu, f)
                print(
                    f"Counter matrix saved successfully at {self.counter_matrix_path}"
                )
            except Exception as e:
                print(f"Error saving counter matrix: {e}")

    def get_counter_strength(self, brawler_idx, enemy_idx):
        """
        Get the counter strength of brawler_idx against enemy_idx.
        Higher values mean brawler_idx counters enemy_idx more strongly.

        Args:
            brawler_idx (int): Index of the potential brawler
            enemy_idx (int): Index of the enemy brawler

        Returns:
            float: Counter strength value between 0 and 1
        """
        # print(self.counter_matrix[brawler_idx, enemy_idx].item())
        return self.counter_matrix[brawler_idx, enemy_idx].item()

    def write_tier_list(self, tierlist_path):
        dataScoring = []
        for rankedMap in self.appConfig.dataMaps:
            nbBrawlers = len(self.appConfig.dataIndex["brawlers"])
            mapName = rankedMap["name"]
            excluded_brawlers = []
            friend_brawlers = []
            enemy_brawlers = []

            row = {
                "mapName": mapName,
                "tierList": self.predict_best_brawler(
                    friends=friend_brawlers,
                    enemies=enemy_brawlers,
                    map_name=mapName,
                    excluded=excluded_brawlers,
                    nbBrawlers=nbBrawlers - 2,
                ),
            }

            dataScoring.append(row)

        # Save to a JSON file (override mode)
        with open(tierlist_path, "w") as json_file:
            json.dump(dataScoring, json_file, indent=4)

        print(f"Data saved to {tierlist_path}")

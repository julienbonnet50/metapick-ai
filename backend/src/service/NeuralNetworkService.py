import sys
import os
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
    def __init__(self, appConfig=None, data_path="", model_path="", device=None, version="35", autoLoadEnable=True):
        self.data_path = data_path
        self.model_path = model_path
        self.appConfig = appConfig
        self.version = version
        self.autoLoadEnable = autoLoadEnable
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        self.brawler_to_idx = None
        self.map_to_idx = None
        self.dataset = None
        self.model = None

        self.load_data()

        if autoLoadEnable:
            self.load_model()

    def setVersion(self, version):
        self.version = version

        # Example: Pad missing friends and enemies in the dataset
    def prepare_dataset(self, df, num_friends=3, num_enemies=3, pad_idx=0):
        # Ensure the required columns exist
        for i in range(1, num_friends + 1):
            if f'friend{i}' not in df.columns:
                df[f'friend{i}'] = pad_idx  # Pad missing friends with pad_idx
        
        for i in range(1, num_enemies + 1):
            if f'enemy{i}' not in df.columns:
                df[f'enemy{i}'] = pad_idx  # Pad missing enemies with pad_idx
        
        return df
    
    def load_data(self):
        print(f"Loading data locally at path : {self.data_path}")
        if os.path.exists(self.data_path) and self.autoLoadEnable == True:
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
    
    def fetch_battle_data(self):
        conn = psycopg2.connect(
            dbname='bs-project',
            user="postgres",
            password=self.appConfig.POSTGRE_SQL_PASSWORD,
            host="localhost",
            port="5432"
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
        for team in df['wteam'].str.split('-').dropna():
            brawler_set.update(team)
        for team in df['lteam'].str.split('-').dropna():
            brawler_set.update(team)
        
        brawler_to_idx = {b: i for i, b in enumerate(sorted(brawler_set))}
        map_to_idx = {m: i for i, m in enumerate(sorted(df['map'].dropna().unique()))}
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
            num_enemies=num_enemies
        )
        
        # Load model weights if they exist
        if os.path.exists(self.model_path):
            print(f"Found existing model at path '{self.model_path}'")
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        else:
            print(f"Model not found at path '{self.model_path}'")
            raise FileNotFoundError(f"Model not found at path '{self.model_path}'")
        self.model.to(self.device)

    def initialize_model(self, num_brawlers, num_maps, emb_dim=16, hidden_dim=64):
        """Initialize the BrawlerPredictionModel with the correct parameters"""
        print(f"Initializing model with {num_brawlers} brawlers and {num_maps} maps...")
        self.model = BrawlerPredictionModel(
            num_brawlers=num_brawlers,
            num_maps=num_maps,
            emb_dim=emb_dim,
            hidden_dim=hidden_dim
        ).to(self.device)
        print("Model initialized successfully")
        return self.model
    
    def train_model(self, num_epochs=10, batch_size=64, num_friends=3, num_enemies=3, val_split=0.1, patience=5):
        # Ensure we have mappings
        if self.brawler_to_idx is None or self.map_to_idx is None:
            raise ValueError("Mappings not initialized. Please load or build mappings before training.")
        
        # Ensure model is initialized
        if self.model is None:
            print("Model is not initialized. Initializing model...")
            self.initialize_model(
                num_brawlers=len(self.brawler_to_idx),
                num_maps=len(self.map_to_idx)
            )
        
        print("Preparing for training...")
        
        # Create validation split
        dataset_size = len(self.dataset)
        val_size = int(val_split * dataset_size)
        train_size = dataset_size - val_size
        train_dataset, val_dataset = torch.utils.data.random_split(self.dataset, [train_size, val_size])
        
        # Create dataloaders
        train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_dataloader = DataLoader(val_dataset, batch_size=batch_size)
        
        # Optimizer and scheduler
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
        criterion = nn.CrossEntropyLoss()
        
        # For mixed precision training
        scaler = torch.cuda.amp.GradScaler()
        
        # For early stopping
        best_val_loss = float('inf')
        patience_counter = 0
        
        print(f"Starting training for {num_epochs} epochs...")
        
        for epoch in range(num_epochs):
            # Training phase
            self.model.train()
            total_train_loss = 0.0
            
            train_progress = tqdm(train_dataloader, desc=f"Epoch {epoch+1}/{num_epochs}")
            for batch in train_progress:
                # Stack friends and enemies into tensors
                friends = torch.stack([batch[f'friend{i+1}'] for i in range(num_friends)], dim=1).to(self.device)
                enemies = torch.stack([batch[f'enemy{i+1}'] for i in range(num_enemies)], dim=1).to(self.device)
                map_idx = batch['map_idx'].unsqueeze(1).to(self.device)
                target = batch['target'].to(self.device)
                
                # Zero gradients
                optimizer.zero_grad()
                
                # Mixed precision forward pass
                with torch.cuda.amp.autocast():
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
                    friends = torch.stack([batch[f'friend{i+1}'] for i in range(num_friends)], dim=1).to(self.device)
                    enemies = torch.stack([batch[f'enemy{i+1}'] for i in range(num_enemies)], dim=1).to(self.device)
                    map_idx = batch['map_idx'].unsqueeze(1).to(self.device)
                    target = batch['target'].to(self.device)
                    
                    # Forward pass
                    logits = self.model(friends, enemies, map_idx)
                    loss = criterion(logits, target)
                    
                    # Track loss
                    total_val_loss += loss.item()
                    val_progress.set_postfix(loss=loss.item())
            
            avg_val_loss = total_val_loss / len(val_dataloader)
            
            # Update learning rate scheduler
            scheduler.step(avg_val_loss)
            
            print(f"Epoch {epoch+1} completed - Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
            
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

    def predict_best_brawler(self, friends, enemies, map_name, excluded=[]):
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
        map_idx = torch.tensor([[self.map_to_idx.get(map_name, 0)]], dtype=torch.long).to(self.device)
        friends_tensor = torch.tensor([friend_indices], dtype=torch.long).to(self.device)
        enemies_tensor = torch.tensor([enemy_indices], dtype=torch.long).to(self.device)
        
        # Combine already picked and explicitly excluded brawlers
        all_excluded = excluded.copy()
        all_excluded.extend(friends)
        all_excluded.extend(enemies)
        
        # Make predictions
        with torch.no_grad():
            logits = self.model(friends_tensor, enemies_tensor, map_idx)
            
            # Exclude all brawlers that are already picked or in the excluded list
            for b in all_excluded:
                if b in self.brawler_to_idx:
                    logits[0, self.brawler_to_idx[b]] = -1e9  # Set very low logit to exclude
                    
            probs = F.softmax(logits, dim=1)
            topk = torch.topk(probs, k=10, dim=1)
        
        # Return top-k brawlers with their probabilities
        return [(self.idx_to_brawler(idx), prob) for idx, prob in zip(topk.indices.squeeze(0).tolist(), topk.values.squeeze(0).tolist())]
    
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
        map_idx = torch.tensor([[self.map_to_idx.get(map_name, 0)]], dtype=torch.long, device=self.device)
        friends_tensor = torch.tensor([friend_indices], dtype=torch.long, device=self.device)
        enemies_tensor = torch.tensor([enemy_indices], dtype=torch.long, device=self.device)

        # Make predictions
        with torch.no_grad():
            logits = self.model(friends_tensor, enemies_tensor, map_idx)  # Shape: (1, num_brawlers)
            mirror_logits = self.model(enemies_tensor, friends_tensor, map_idx)

            # Normalize logits using softmax
            probabilities = torch.softmax(logits, dim=1)
            mirror_probabilities = torch.softmax(mirror_logits, dim=1)

            # Extract friend and enemy scores
            friend_scores = probabilities[0, friend_indices].mean().item()  # Averaging instead of summing
            enemy_scores = mirror_probabilities[0, enemy_indices].mean().item()

            # Compute relative strength
            relative_strength = friend_scores - enemy_scores

            # Apply a calibrated sigmoid function
            scale = 5  # Tune this parameter based on validation data
            win_rate = 100 * (1 / (1 + torch.exp(torch.tensor(-relative_strength * scale, device=self.device)))).item()

        return round(win_rate, 2)


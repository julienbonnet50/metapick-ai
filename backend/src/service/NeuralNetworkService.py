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

from backend.src.utils.modelUtils import BattleDataset, BrawlerPredictionModel

class NeuralNetworkService:
    def __init__(self, appConfig=None, data_path="", model_path="", device=None, version="35", autoLoadEnable=True):
        self.data_path = data_path
        self.model_path = model_path
        self.appConfig = appConfig
        self.version = version
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        self.brawler_to_idx = None
        self.map_to_idx = None
        self.dataset = None
        self.model = None

        if autoLoadEnable:
            self.load_data()
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
        if os.path.exists(self.data_path):
            print("Loading data from file...")
            with open(self.data_path, "rb") as f:
                data = pickle.load(f)
            self.brawler_to_idx = data["brawler_to_idx"]
            self.map_to_idx = data["map_to_idx"]
            self.dataset = BattleDataset.__new__(BattleDataset)
            self.dataset.samples = data["dataset_samples"]
        else:
            print("Loading data from SQL...")
            df = self.fetch_battle_data()
            df = self.prepare_dataset(df, num_friends=3, num_enemies=3, pad_idx=0)
            self.brawler_to_idx, self.map_to_idx = self.build_mappings(df)
            self.dataset = BattleDataset(df, self.brawler_to_idx, self.map_to_idx)
            self.save_mappings()
    
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
    
    def save_mappings(self):
        dataMappings = {
            "brawler_to_idx": self.brawler_to_idx,
            "map_to_idx": self.map_to_idx,
        }
        # Ensure the directory exists
        directory = os.path.dirname(self.data_path)
        if not os.path.exists(directory):
            os.makedirs(directory)

        with open(self.data_path, "wb") as f:
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
        self.model.to(self.device)
    
    def train_model(self, num_epochs=10, batch_size=64, num_friends=3, num_enemies=3):
        if os.path.exists(self.model_path):
            print(f"Found existing model at path '{self.model_path}' abording training...")

        print("Training model...")
        dataloader = DataLoader(self.dataset, batch_size=batch_size, shuffle=True)
        print("     Dataloader instanced")
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        print("     Optimizer instanced")
        criterion = nn.CrossEntropyLoss()
        print("     CrossEntropyLoss instanced")
        
        print(f"Start training for {num_epochs} epochs...")
        
        for epoch in range(num_epochs):
            print(f"Epoch {epoch+1}/{num_epochs} started")
            self.model.train()
            total_loss = 0.0
            
            for batch_idx, batch in enumerate(dataloader):
                print(f"     Processing batch {batch_idx+1}/{len(dataloader)}")
                
                # Stack friends and enemies into tensors
                friends = torch.stack([batch[f'friend{i+1}'] for i in range(num_friends)], dim=1).to(self.device)
                print(f"         Friends tensor shape: {friends.shape}")

                enemies = torch.stack([batch[f'enemy{i+1}'] for i in range(num_enemies)], dim=1).to(self.device)
                print(f"         Enemies tensor shape: {enemies.shape}")

                map_idx = batch['map_idx'].unsqueeze(1).to(self.device)
                print(f"         Map index shape: {map_idx.shape}")

                target = batch['target'].to(self.device)
                print(f"         Target shape: {target.shape}")

                optimizer.zero_grad()
                logits = self.model(friends, enemies, map_idx)
                print(f"         Logits shape: {logits.shape}")

                loss = criterion(logits, target)
                print(f"         Batch loss: {loss.item():.4f}")

                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            avg_loss = total_loss / len(dataloader)
            print(f"Epoch {epoch+1} completed - Average Loss: {avg_loss:.4f}")
        
        torch.save(self.model.state_dict(), self.model_path)
        print("Training complete. Model saved.")

    
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

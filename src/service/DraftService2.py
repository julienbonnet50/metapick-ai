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

from src.utils.modelUtils import BattleDataset, BrawlerPredictionModel

class DraftService2:
    def __init__(self, db_config=None, data_path="", model_path="", device=None):
        self.data_path = data_path
        self.model_path = model_path
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        self.brawler_to_idx = None
        self.map_to_idx = None
        self.dataset = None
        self.model = None
        
        # Load or initialize data
        self.load_data(db_config)
        self.load_model()
    
    def load_data(self, db_config):
        if os.path.exists(self.data_path):
            with open(self.data_path, "rb") as f:
                data = pickle.load(f)
            self.brawler_to_idx = data["brawler_to_idx"]
            self.map_to_idx = data["map_to_idx"]
            self.dataset = BattleDataset.__new__(BattleDataset)
            self.dataset.samples = data["dataset_samples"]
        else:
            if not db_config:
                raise ValueError("Database configuration required to fetch initial data.")
            df = self.fetch_battle_data(db_config)
            self.brawler_to_idx, self.map_to_idx = self.build_mappings(df)
            self.dataset = BattleDataset(df, self.brawler_to_idx, self.map_to_idx)
            self.save_mappings_and_dataset()
    
    def fetch_battle_data(self, db_config):
        conn = self.connect_db(db_config)
        if conn is None:
            raise ConnectionError("Could not connect to database.")
        df = pd.read_sql_query("SELECT * FROM battles", conn)
        conn.close()
        return df
    
    def build_mappings(self, df):
        brawler_set = set()
        for team in df['wteam'].str.split('-').dropna():
            brawler_set.update(team)
        for team in df['lteam'].str.split('-').dropna():
            brawler_set.update(team)
        
        brawler_to_idx = {b: i for i, b in enumerate(sorted(brawler_set))}
        map_to_idx = {m: i for i, m in enumerate(sorted(df['map'].dropna().unique()))}
        return brawler_to_idx, map_to_idx
    
    def save_mappings_and_dataset(self):
        data = {
            "brawler_to_idx": self.brawler_to_idx,
            "map_to_idx": self.map_to_idx,
            "dataset_samples": self.dataset.samples
        }
        with open(self.data_path, "wb") as f:
            pickle.dump(data, f)
    
    def load_model(self):
        num_brawlers = len(self.brawler_to_idx)
        num_maps = len(self.map_to_idx)
        self.model = BrawlerPredictionModel(num_brawlers, num_maps)
        
        if os.path.exists(self.model_path):
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.to(self.device)
    
    def train_model(self, num_epochs=10, batch_size=64):
        dataloader = DataLoader(self.dataset, batch_size=batch_size, shuffle=True)
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        criterion = nn.CrossEntropyLoss()
        
        for epoch in range(num_epochs):
            self.model.train()
            total_loss = 0.0
            for batch in dataloader:
                friends = torch.stack([batch['friend1'], batch['friend2']], dim=1).to(self.device)
                enemies = torch.stack([batch['enemy1'], batch['enemy2']], dim=1).to(self.device)
                map_idx = batch['map_idx'].unsqueeze(1).to(self.device)
                target = batch['target'].to(self.device)
                
                optimizer.zero_grad()
                logits = self.model(friends, enemies, map_idx)
                loss = criterion(logits, target)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            print(f"Epoch {epoch+1}/{num_epochs}, Loss: {total_loss / len(dataloader):.4f}")
        
        torch.save(self.model.state_dict(), self.model_path)
    
    def predict_best_brawler(self, friends, enemies, map_name, excluded=[]):
        self.model.eval()
        pad_idx = self.model.pad_idx
        
        friend_indices = [self.brawler_to_idx.get(b, pad_idx) for b in friends]
        enemy_indices = [self.brawler_to_idx.get(b, pad_idx) for b in enemies]
        
        while len(friend_indices) < 3:
            friend_indices.append(pad_idx)
        while len(enemy_indices) < 3:
            enemy_indices.append(pad_idx)
        
        map_idx = torch.tensor([[self.map_to_idx.get(map_name, 0)]], dtype=torch.long).to(self.device)
        friends_tensor = torch.tensor([friend_indices], dtype=torch.long).to(self.device)
        enemies_tensor = torch.tensor([enemy_indices], dtype=torch.long).to(self.device)
        
        with torch.no_grad():
            logits = self.model(friends_tensor, enemies_tensor, map_idx)
            if excluded:
                for b in excluded:
                    if b in self.brawler_to_idx:
                        logits[0, self.brawler_to_idx[b]] = -1e9
            probs = F.softmax(logits, dim=1)
            topk = torch.topk(probs, k=10, dim=1)
        
        return [(self.idx_to_brawler(idx), prob) for idx, prob in zip(topk.indices.squeeze(0).tolist(), topk.values.squeeze(0).tolist())]
    
    def idx_to_brawler(self, idx):
        return {i: b for b, i in self.brawler_to_idx.items()}.get(idx, "Unknown")

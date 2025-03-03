import os
import sys
import random
import psycopg2
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

class BattleDataset(Dataset):
    def __init__(self, df, brawler_to_idx, map_to_idx, pad_idx=0):
        """
        For each battle, we generate training samples by taking the winning team and:
          - Hiding one brawler (the target to predict).
          - Using the remaining two as our team's picks.
          - Sampling three brawlers from the losing team as the enemy picks (padding if necessary).
          - Using the battle map.
        """
        self.samples = []
        self.pad_idx = pad_idx

        for idx, row in df.iterrows():
            # Get and validate the map
            map_name = row['map'].strip()
            if map_name not in map_to_idx:
                continue
            map_idx = map_to_idx[map_name]

            # Process winning team (assumed to have 3 brawlers)
            win_team = [b.strip() for b in row['wteam'].split('-')]
            if len(win_team) != 3:
                continue

            # Process losing team (need at least 2 brawlers)
            lose_team = [b.strip() for b in row['lteam'].split('-')]
            if len(lose_team) < 2:
                continue

            # Create a sample for each brawler in the winning team (by "hiding" one)
            for i in range(3):
                target_brawler = win_team[i]
                friends = [win_team[j] for j in range(3) if j != i]
                # Randomly select two enemy brawlers from the losing team
                enemy_picks = random.sample(lose_team, min(2, len(lose_team)))

                # Pad friends and enemies to ensure 3 friends and 3 enemies
                friends += [pad_idx] * (2 - len(friends))  # Pad friends to 2 (since one is hidden)
                enemy_picks += [pad_idx] * (2 - len(enemy_picks))  # Pad enemies to 2

                try:
                    sample = {
                        'friend1': brawler_to_idx[friends[0]],
                        'friend2': brawler_to_idx[friends[1]],
                        'friend3': pad_idx,  # Third friend is always padding
                        'enemy1': brawler_to_idx[enemy_picks[0]],
                        'enemy2': brawler_to_idx[enemy_picks[1]],
                        'enemy3': pad_idx,  # Third enemy is always padding
                        'map_idx': map_idx,
                        'target': brawler_to_idx[target_brawler]
                    }
                    self.samples.append(sample)
                except KeyError:
                    # Skip if any brawler isn't in our mapping
                    continue
        print(f"Total training samples: {len(self.samples)}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        sample = self.samples[index]
        return {
            'friend1': torch.tensor(sample['friend1'], dtype=torch.long),
            'friend2': torch.tensor(sample['friend2'], dtype=torch.long),
            'friend3': torch.tensor(sample['friend3'], dtype=torch.long),
            'enemy1': torch.tensor(sample['enemy1'], dtype=torch.long),
            'enemy2': torch.tensor(sample['enemy2'], dtype=torch.long),
            'enemy3': torch.tensor(sample['enemy3'], dtype=torch.long),
            'map_idx': torch.tensor(sample['map_idx'], dtype=torch.long),
            'target': torch.tensor(sample['target'], dtype=torch.long)
        }

class BrawlerPredictionModel(nn.Module):
    def __init__(self, num_brawlers, num_maps, emb_dim=16, hidden_dim=64, pad_idx=0, num_friends=3, num_enemies=3):
        """
        A generic model for brawler prediction.
        
        Arguments:
            num_brawlers: Number of unique brawlers.
            num_maps: Number of unique maps.
            emb_dim: Dimension of the embedding vectors.
            hidden_dim: Dimension of the hidden layer.
            pad_idx: Padding index for missing brawlers.
            num_friends: Number of friend brawlers (default: 3).
            num_enemies: Number of enemy brawlers (default: 3).
        """
        super(BrawlerPredictionModel, self).__init__()
        self.pad_idx = pad_idx  # Special index for missing brawlers
        self.num_friends = num_friends
        self.num_enemies = num_enemies

        # Brawler and map embeddings
        self.brawler_embedding = nn.Embedding(num_brawlers, emb_dim, padding_idx=pad_idx)
        self.map_embedding = nn.Embedding(num_maps, emb_dim)

        # Calculate input dimension dynamically
        input_dim = (num_friends + num_enemies + 1) * emb_dim

        # Fully connected layers
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, num_brawlers)

    def forward(self, friends, enemies, map_idx):
        """
        Arguments:
            friends: Tensor of shape (batch, num_friends) containing indices of friendly brawlers.
            enemies: Tensor of shape (batch, num_enemies) containing indices of enemy brawlers.
            map_idx: Tensor of shape (batch, 1) containing map indices.
        """
        # Embed friends and enemies: resulting shapes (batch, num_friends, emb_dim) and (batch, num_enemies, emb_dim)
        emb_friends = self.brawler_embedding(friends)
        emb_enemies = self.brawler_embedding(enemies)
        # Embed map and remove extra dim: shape becomes (batch, emb_dim)
        emb_map = self.map_embedding(map_idx).squeeze(1)

        # Flatten friend and enemy embeddings: (batch, num_friends * emb_dim) and (batch, num_enemies * emb_dim)
        emb_friends = emb_friends.view(emb_friends.shape[0], -1)
        emb_enemies = emb_enemies.view(emb_enemies.shape[0], -1)

        # Concatenate all embeddings: shape (batch, (num_friends + num_enemies + 1) * emb_dim)
        x = torch.cat([emb_friends, emb_enemies, emb_map], dim=1)
        x = F.relu(self.fc1(x))
        logits = self.fc2(x)

        return logits
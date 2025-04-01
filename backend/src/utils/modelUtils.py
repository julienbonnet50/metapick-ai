import random
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset


# Dataset class from your code
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

# Enhanced model with meta-awareness
class EnhancedBrawlerPredictionModel(nn.Module):
    def __init__(self, num_brawlers, num_maps, emb_dim=32, hidden_dim=128, pad_idx=0, num_friends=3, num_enemies=3):
        """
        An enhanced model for brawler prediction with meta-awareness.
        """
        super(EnhancedBrawlerPredictionModel, self).__init__()
        self.pad_idx = pad_idx
        self.num_friends = num_friends
        self.num_enemies = num_enemies
        self.num_brawlers = num_brawlers
        
        # Embeddings
        self.brawler_embedding = nn.Embedding(num_brawlers, emb_dim, padding_idx=pad_idx)
        self.map_embedding = nn.Embedding(num_maps, emb_dim)
        
        # Meta-aware layer
        self.meta_weights = nn.Parameter(torch.ones(num_brawlers))
        
        # Map-brawler interaction layer
        self.map_brawler_attention = nn.Linear(emb_dim, emb_dim)
        
        # Counter-pick modeling layer
        self.counter_matrix = nn.Parameter(torch.zeros(num_brawlers, num_brawlers))
        
        # Main network layers
        self.attention = nn.MultiheadAttention(embed_dim=emb_dim, num_heads=4, batch_first=True)
        
        # Calculate input dimension
        self.input_dim = emb_dim * (num_friends + num_enemies + 1)
        
        # Fully connected layers with dropout for regularization
        self.dropout = nn.Dropout(0.3)
        self.fc1 = nn.Linear(self.input_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.bn2 = nn.BatchNorm1d(hidden_dim // 2)
        self.fc3 = nn.Linear(hidden_dim // 2, num_brawlers)

    def forward_old(self, friends, enemies, map_idx):
        batch_size = friends.shape[0]
        
        # Embed all inputs
        emb_friends = self.brawler_embedding(friends)  # [batch, num_friends, emb_dim]
        emb_enemies = self.brawler_embedding(enemies)  # [batch, num_enemies, emb_dim]
        emb_map = self.map_embedding(map_idx).squeeze(1)  # [batch, emb_dim]
        
        # Apply meta-awareness: scale embeddings by meta weights
        meta_weights_expanded = self.meta_weights.unsqueeze(1)  # [num_brawlers, 1]
        
        # Apply map-brawler attention
        map_attention = torch.sigmoid(self.map_brawler_attention(emb_map)).unsqueeze(1)  # [batch, 1, emb_dim]
        
        # Apply attention mechanism for better feature interaction
        all_brawlers = torch.cat([emb_friends, emb_enemies], dim=1)  # [batch, num_friends+num_enemies, emb_dim]
        attended_brawlers, _ = self.attention(all_brawlers, all_brawlers, all_brawlers)
        
        # Flatten and concatenate
        flat_friends = emb_friends.reshape(batch_size, -1)  # [batch, num_friends*emb_dim]
        flat_enemies = emb_enemies.reshape(batch_size, -1)  # [batch, num_enemies*emb_dim]
        
        # Concatenate all features
        x = torch.cat([flat_friends, flat_enemies, emb_map], dim=1)  # [batch, input_dim]
        
        # Apply fully connected layers with regularization
        x = self.dropout(x)
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = F.relu(self.bn2(self.fc2(x)))
        logits = self.fc3(x)
        
        # Apply counter-pick adjustments
        for i in range(batch_size):
            for j in range(self.num_enemies):
                enemy_idx = enemies[i, j].item()
                if enemy_idx != self.pad_idx:
                    # Add counter-pick bias
                    logits[i] += self.counter_matrix[enemy_idx]
        
        return logits
    
    def forward(self, friends, enemies, map_idx):
        batch_size = friends.shape[0]
        
        # Embed all inputs
        emb_friends = self.brawler_embedding(friends)  # [batch, num_friends, emb_dim]
        emb_enemies = self.brawler_embedding(enemies)  # [batch, num_enemies, emb_dim]
        emb_map = self.map_embedding(map_idx).squeeze(1)  # [batch, emb_dim]
        
        # Apply map-brawler attention
        map_attention = torch.sigmoid(self.map_brawler_attention(emb_map)).unsqueeze(1)  # [batch, 1, emb_dim]
        
        # Process enemy embeddings with position-aware attention
        # Create a position encoding for enemies
        enemy_positions = torch.arange(self.num_enemies).float().to(enemies.device)
        enemy_positions = enemy_positions.unsqueeze(0).unsqueeze(2).expand(batch_size, -1, 1)
        
        # Combine enemy embeddings with their positions
        enemy_pos_embed = self.enemy_position_embedding(enemy_positions)
        augmented_enemies = emb_enemies + enemy_pos_embed
        
        # Apply self-attention to enemies to capture interactions between them
        enemy_attention_out, _ = self.enemy_attention(augmented_enemies, augmented_enemies, augmented_enemies)
        
        # Separate attention for friends
        friend_attention_out, _ = self.friend_attention(emb_friends, emb_friends, emb_friends)
        
        # Cross-attention between friends and enemies
        # This helps the model understand how friends match up against the enemy team
        cross_attention_out, _ = self.cross_attention(friend_attention_out, enemy_attention_out, enemy_attention_out)
        
        # Flatten and concatenate with appropriate weighting
        flat_friends = cross_attention_out.reshape(batch_size, -1)  # [batch, num_friends*emb_dim]
        flat_enemies = enemy_attention_out.reshape(batch_size, -1)  # [batch, num_enemies*emb_dim]
        
        # Concatenate all features with map embedding
        x = torch.cat([flat_friends, flat_enemies, emb_map], dim=1)  # [batch, input_dim]
        
        # Apply fully connected layers with regularization
        x = self.dropout(x)
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = F.relu(self.bn2(self.fc2(x)))
        logits = self.fc3(x)
        
        # Apply enhanced counter-pick adjustments with position-aware scaling
        for i in range(batch_size):
            counter_influence = torch.zeros_like(logits[i])
            valid_enemies = 0
            
            for j in range(self.num_enemies):
                enemy_idx = enemies[i, j].item()
                if enemy_idx != self.pad_idx:
                    valid_enemies += 1
                    # Position scaling - can adjust these weights
                    position_importance = 1.0  # Equal importance for all positions
                    
                    # Add counter-pick bias with position scaling
                    counter_influence += self.counter_matrix[enemy_idx] * position_importance
            
            # Only apply if we have valid enemies, and normalize by the number of enemies
            if valid_enemies > 0:
                # Scale by number of enemies to prevent overwhelming influence as team grows
                counter_scaling = 1.0  # This parameter controls how much additional enemies matter
                logits[i] += counter_influence * counter_scaling / valid_enemies
        
        return logits

# Original model class from your code
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
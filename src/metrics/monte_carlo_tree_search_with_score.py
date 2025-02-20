import random
import math
import sys
import os
import pandas as pd

# Necessary import
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))

import src.config.AppConfig as AppConfig

appConfig = AppConfig.AppConfig()

class Brawler:
    def __init__(self, name, win_rate, usage_rate, map_name):
        self.name = name
        self.win_rate = win_rate
        self.usage_rate = usage_rate
        self.map_name = map_name

class DraftState:
    def __init__(self, available_brawlers, team, opponent_team, map_name):
        self.available_brawlers = available_brawlers
        self.team = team
        self.opponent_team = opponent_team
        self.map_name = map_name

    def get_legal_actions(self):
        return self.available_brawlers

    def take_action(self, brawler):
        new_team = self.team + [brawler]
        new_available_brawlers = [b for b in self.available_brawlers if b != brawler]
        return DraftState(new_available_brawlers, new_team, self.opponent_team, self.map_name)

    def is_terminal(self):
        return len(self.team) == 3 and len(self.opponent_team) == 3

    def get_reward(self):
        # Evaluate the performance of the team
        return evaluate_team(self.team, self.map_name)

    def __repr__(self):
        return f"Team: {[b.name for b in self.team]}, Opponent: {[b.name for b in self.opponent_team]}, Map: {self.map_name}"

class Node:
    def __init__(self, state, parent=None):
        self.state = state
        self.parent = parent
        self.children = []
        self.visits = 0
        self.value = 0

    def is_fully_expanded(self):
        return len(self.children) == len(self.state.get_legal_actions())

    def best_child(self, c_param=1.4):
        choices_weights = [
            (child.value / child.visits) + c_param * math.sqrt((2 * math.log(self.visits) / child.visits))
            for child in self.children
        ]
        return self.children[choices_weights.index(max(choices_weights))]

    def most_visited_child(self):
        return max(self.children, key=lambda c: c.visits)

def select(node):
    while not node.state.is_terminal():
        if not node.is_fully_expanded():
            return expand(node)
        else:
            node = node.best_child()
    return node

def expand(node):
    tried_actions = [child.state.team[-1] for child in node.children]
    possible_actions = node.state.get_legal_actions()
    for action in possible_actions:
        if action not in tried_actions:
            new_state = node.state.take_action(action)
            new_node = Node(new_state, parent=node)
            node.children.append(new_node)
            return new_node
    raise Exception("Should never reach here")

def simulate(state):
    current_state = state
    while not current_state.is_terminal():
        possible_actions = current_state.get_legal_actions()
        if not possible_actions:
            break
        action = random.choice(possible_actions)
        current_state = current_state.take_action(action)
    return current_state.get_reward()

def backpropagate(node, reward):
    while node is not None:
        node.visits += 1
        node.value += reward
        node = node.parent

def mcts(root_state, itermax):
    root = Node(root_state)

    for _ in range(itermax):
        node = select(root)
        if not node.state.is_terminal():
            node = expand(node)
        reward = simulate(node.state)
        backpropagate(node, reward)

    return root.most_visited_child().state.team[-1]

def evaluate_team(team, map_name):
    # Example evaluation function: sum of win rates for the given map
    return sum(brawler.win_rate for brawler in team if brawler.map_name == map_name)

# Load the DataFrame from the pickle file
df = pd.read_pickle('data/model/rankedstats_permaps.pkl')

# Exclude specific brawlers
excluded_brawlers = []

# Filter the DataFrame for a specific map
map_name = "Ring of Fire"  # Replace with the desired map name
filtered_df = df[df['map'] == map_name]

# Create Brawler objects from the DataFrame, excluding specific brawlers
brawlers = [Brawler(row['brawler'], row['win_rate'], row['usage_rate'], row['map']) for index, row in filtered_df.iterrows() if row['brawler'] not in excluded_brawlers]

# Example usage
initial_state = DraftState(brawlers, [], [], map_name)
best_brawler = mcts(initial_state, itermax=1000)
print(f"Best brawler to pick for map '{map_name}': {best_brawler.name}")

# Retrieve the top 10 brawlers to pick for the specific map
top_10_brawlers = filtered_df[~filtered_df['brawler'].isin(excluded_brawlers)]
top_10_brawlers.to_csv('top_10_brawlers.csv', index=False)
print(f"Top 10 brawlers to pick for map '{map_name}':")
print(top_10_brawlers[['brawler', 'score', 'win_rate', 'usage_rate']])

import random
import math
import sys
import os
import pandas as pd
import numpy as np

# Necessary import
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

import src.config.AppConfig as AppConfig

appConfig = AppConfig.AppConfig()

# Update Brawler class to include the pre-calculated score
class Brawler:
    def __init__(self, name, win_rate, usage_rate, score, map_name):
        self.name = name
        self.win_rate = win_rate
        self.usage_rate = usage_rate
        self.score = score
        self.map_name = map_name

    def __eq__(self, other):
        return isinstance(other, Brawler) and self.name == other.name

    def __hash__(self):
        return hash(self.name)

class DraftState:
    def __init__(self, available_brawlers, team, opponent_team, map_name):
        self.available_brawlers = available_brawlers
        self.team = team            # Team A (your team)
        self.opponent_team = opponent_team  # Team B (opponent)
        self.map_name = map_name

    def current_turn(self):
        # If total picks so far is even, it’s team A’s turn; if odd, team B’s turn.
        total_picks = len(self.team) + len(self.opponent_team)
        return 'team' if total_picks % 2 == 0 else 'opponent'

    def get_legal_actions(self):
        return self.available_brawlers

    def take_action(self, brawler):
        # Determine which team is picking based on turn order.
        if self.current_turn() == 'team':
            new_team = self.team + [brawler]
            new_opponent_team = self.opponent_team
        else:
            new_team = self.team
            new_opponent_team = self.opponent_team + [brawler]
        new_available_brawlers = [b for b in self.available_brawlers if b != brawler]
        return DraftState(new_available_brawlers, new_team, new_opponent_team, self.map_name)

    def is_terminal(self):
        # Terminal state when both teams have 3 brawlers.
        return len(self.team) == 3 and len(self.opponent_team) == 3

    def get_reward(self):
        # Evaluate the state based on the pre-calculated score.
        return evaluate_state(self)

    def __repr__(self):
        return f"Team A: {[b.name for b in self.team]}, Team B: {[b.name for b in self.opponent_team]}, Map: {self.map_name}"

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
    tried_names = [b.name for child in node.children for b in (child.state.team + child.state.opponent_team)]
    print(f"Tried names: {tried_names}")
    available_actions = node.state.get_legal_actions()
    print(f"Available actions: {[b.name for b in available_actions]}")
    for action in available_actions:
        if action.name not in tried_names:
            new_state = node.state.take_action(action)
            new_node = Node(new_state, parent=node)
            node.children.append(new_node)
            print(f"Expanded node with action: {action.name}")
            return new_node
    raise Exception("No valid actions to expand.")

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

    return root.most_visited_child().state

def evaluate_state(state):
    # Use the pre-calculated score from each brawler.
    team_A_score = sum(b.score for b in state.team if b.map_name == state.map_name)
    team_B_score = sum(b.score for b in state.opponent_team if b.map_name == state.map_name)
    # A positive reward favors team A; negative favors team B.
    return team_A_score - team_B_score

# Load the DataFrame from the pickle file
df = pd.read_pickle('data/model/rankedstats_permaps.pkl')

# Exclude specific brawlers
excluded_brawlers = ["LOU", "SPIKE"]

# Filter the DataFrame for a specific map
map_name = "Ring of Fire"  # Replace with the desired map name
filtered_df = df[df['map'] == map_name]

# Create Brawler objects from the DataFrame, including the important score, excluding specific brawlers
brawlers = [
    Brawler(row['brawler'], row['win_rate'], row['usage_rate'], row['score'], row['map'])
    for index, row in filtered_df.iterrows()
    if row['brawler'] not in excluded_brawlers
]

# Create a lookup dictionary for brawlers by name.
brawler_lookup = {b.name: b for b in brawlers}

# Initialize teams using Brawler objects.
initial_team = [brawler_lookup["PENNY"], brawler_lookup["JESSIE"]]
initial_opponent = [brawler_lookup["STU"]]

# Print the initial state for debugging
print("Initial State:")
print(f"Available Brawlers: {[b.name for b in brawlers]}")
print(f"Initial Team A: {[b.name for b in initial_team]}")
print(f"Initial Team B: {[b.name for b in initial_opponent]}")
print(f"Map Name: {map_name}")

initial_state = DraftState(brawlers, initial_team, initial_opponent, map_name)

# Run MCTS to simulate the draft.
final_state = mcts(initial_state, itermax=1000)

print("Final draft state:")
print(final_state)
if final_state.team:
    print(f"\nBest pick for team A (final pick): {final_state.team[-1].name}")
else:
    print("No picks for team A.")

# Retrieve the top 15 brawlers for the specific map (for additional stats reporting)
top_15_brawlers = filtered_df[~filtered_df['brawler'].isin(excluded_brawlers)].head(15)
top_15_brawlers.to_csv('data/metrics/top_15_brawlers.csv', index=False)
print("\nTop 15 brawlers for map '{}':".format(map_name))
print(top_15_brawlers[['brawler', 'score', 'win_rate', 'usage_rate']])

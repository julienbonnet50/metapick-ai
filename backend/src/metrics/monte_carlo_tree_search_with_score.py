import random
import math
import sys
import os
import pandas as pd
import numpy as np

# Necessary import
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

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
    def __init__(self, available_brawlers, team, opponent_team, map_name, excluded_brawlers, firstPickTeam):
        self.available_brawlers = available_brawlers
        self.team = team            # Team A (your team)
        self.opponent_team = opponent_team  # Team B (opponent)
        self.map_name = map_name
        self.excluded_brawlers = excluded_brawlers
        self.firstPickTeam = firstPickTeam

    def current_turn(self):
        # Determine the current turn based on the first pick team and the total number of picks
        total_picks = len(self.team) + len(self.opponent_team)
        if self.firstPickTeam == "A":
            return 'team' if total_picks % 2 == 0 else 'opponent'
        else:
            return 'opponent' if total_picks % 2 == 0 else 'team'

    def get_legal_actions(self):
        # Exclude brawlers that are in the excluded list or already in the teams
        return [b for b in self.available_brawlers if b.name not in self.excluded_brawlers and b not in self.team and b not in self.opponent_team]

    def take_action(self, brawler):
        # Determine which team is picking based on turn order.
        if self.current_turn() == 'team':
            new_team = self.team + [brawler]
            new_opponent_team = self.opponent_team
        else:
            new_team = self.team
            new_opponent_team = self.opponent_team + [brawler]
        new_available_brawlers = [b for b in self.available_brawlers if b != brawler]
        return DraftState(new_available_brawlers, new_team, new_opponent_team, self.map_name, self.excluded_brawlers, self.firstPickTeam)

    def is_terminal(self):
        # Terminal state when both teams have 3 brawlers.
        return len(self.team) == 3 and len(self.opponent_team) == 3

    def get_reward(self):
        # Evaluate the state based on the pre-calculated score.
        return evaluate_state(self)

    def __repr__(self):
        return f"Team A: {[b.name for b in self.team]}, Team B: {[b.name for b in self.opponent_team]}, Map: {self.map_name}"

# --- Updated Node Class ---
class Node:
    def __init__(self, state, parent=None, action=None):
        self.state = state
        self.parent = parent
        self.action = action  # the brawler that was picked to reach this node from its parent
        self.children = []
        self.visits = 0
        self.value = 0

    def is_fully_expanded(self):
        legal_actions = self.state.get_legal_actions()
        tried_actions = {child.action.name for child in self.children if child.action is not None}
        return len(legal_actions) == len(tried_actions)

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
    # Instead of scanning the entire team's picks, we now just track the action that led to each child.
    tried_actions = {child.action.name for child in node.children if child.action is not None}
    for action in node.state.get_legal_actions():
        if action.name not in tried_actions:
            new_state = node.state.take_action(action)
            new_node = Node(new_state, parent=node, action=action)
            node.children.append(new_node)
            # print(f"Expanded node with action: {action.name}")
            return new_node
    raise Exception("No valid actions to expand.")

def simulate(state):
    current_state = state
    while not current_state.is_terminal():
        possible_actions = current_state.get_legal_actions()
        if not possible_actions:
            break
        action = random.choice(possible_actions)
        # print(f"Simulating action: {action.name}")
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

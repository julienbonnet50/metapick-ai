import random
import math

class Brawler:
    def __init__(self, name, win_rate, usage_rate):
        self.name = name
        self.win_rate = win_rate
        self.usage_rate = usage_rate

class DraftState:
    def __init__(self, available_brawlers, team, opponent_team):
        self.available_brawlers = available_brawlers
        self.team = team
        self.opponent_team = opponent_team

    def get_legal_actions(self):
        return self.available_brawlers

    def take_action(self, brawler):
        new_team = self.team + [brawler]
        new_available_brawlers = [b for b in self.available_brawlers if b != brawler]
        return DraftState(new_available_brawlers, new_team, self.opponent_team)

    def is_terminal(self):
        return len(self.team) == 3 and len(self.opponent_team) == 3

    def get_reward(self):
        # Evaluate the performance of the team
        return evaluate_team(self.team)

    def __repr__(self):
        return f"Team: {[b.name for b in self.team]}, Opponent: {[b.name for b in self.opponent_team]}"

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

def evaluate_team(team):
    # Example evaluation function: sum of win rates
    return sum(brawler.win_rate for brawler in team)

# Example usage
available_brawlers = [
    Brawler("STU", 55, 50),
    Brawler("BERRY", 55, 45),
    Brawler("ASH", 50, 40),
    Brawler("JACKY", 45, 35),
    Brawler("RICO", 40, 30),
    Brawler("EMZ", 35, 25),
    Brawler("COLT", 30, 20),
    Brawler("GRIFF", 25, 15),
    Brawler("JUJU", 20, 10),
    Brawler("GUS", 15, 5),
    Brawler("ANGELO", 10, 5),
    Brawler("BROCK", 5, 5),
    Brawler("SPIKE", 5, 5),
    Brawler("CROW", 5, 5),
    Brawler("MAX", 5, 5),
    Brawler("STU", 5, 5),
]

initial_state = DraftState(available_brawlers, [], [])
best_brawler = mcts(initial_state, itermax=1000)
print(f"Best brawler to pick: {best_brawler.name}")

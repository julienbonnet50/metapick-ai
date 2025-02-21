import pandas as pd
import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
from src.metrics.monte_carlo_tree_search_with_score import Brawler, DraftState, mcts


class DraftService:
    def __init__(self):
        # Load the DataFrame from the pickle file
        self.df = pd.read_pickle('data/model/rankedstats_permaps_topsis2.pkl')

    def run_draft(self, map_name, excluded_brawlers, initial_team, initial_opponent, saveEnabled=False):
        # Filter the DataFrame for the specified map
        filtered_df = self.df[self.df['map'] == map_name]

        # Create Brawler objects from the DataFrame, excluding specific brawlers
        brawlers = [
            Brawler(row['brawler'], row['adj_win_rate'], row['usage_rate'], row['topsis_score'], row['map'])
            for index, row in filtered_df.iterrows()
            if row['brawler'] not in excluded_brawlers
        ]

        # Create a lookup dictionary for brawlers by name
        brawler_lookup = {b.name: b for b in brawlers}

        # Initialize teams using Brawler objects
        initial_team = [brawler_lookup[name] for name in initial_team]
        initial_opponent = [brawler_lookup[name] for name in initial_opponent]

        # Print the initial state for debugging
        print("Initial State:")
        print(f"Available Brawlers: {[b.name for b in brawlers]}")
        print(f"Initial Team A: {[b.name for b in initial_team]}")
        print(f"Initial Team B: {[b.name for b in initial_opponent]}")
        print(f"Map Name: {map_name}")

        initial_state = DraftState(brawlers, initial_team, initial_opponent, map_name)

        # Run MCTS to simulate the draft
        final_state = mcts(initial_state, itermax=1000)

        print("Final draft state:")
        print(final_state)
        if final_state.team:
            print(f"\nBest pick for team A (final pick): {final_state.team[-1].name}")
        else:
            print("No picks for team A.")

        if saveEnabled:
            # Retrieve the top 15 brawlers for the specific map (for additional stats reporting)
            top_15_brawlers = filtered_df[~filtered_df['brawler'].isin(excluded_brawlers)].head(15)
            top_15_brawlers.to_csv('data/metrics/top_15_brawlers2.csv', index=False)
            print("\nTop 15 brawlers for map '{}':".format(map_name))
            print(top_15_brawlers[['brawler', 'topsis_score', 'adj_win_rate', 'usage_rate']])

        return {
            "map": final_state.map_name,
            "team_A": [b.name for b in final_state.team],
            "team_B": [b.name for b in final_state.opponent_team],
            "best_pick_team_A": final_state.team[-1].name if final_state.team else None
        }

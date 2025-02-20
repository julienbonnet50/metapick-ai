

import math

def format_league_ranks(rank: int):
    # Min rank: 1, Max rank: 19
    leagues = ["Bronze", "Silver", "Gold", "Diamond", "Mythic", "Legendary", "Masters"]
    league_subs = ["I", "II", "III"]

    league = leagues[(rank - 1) // 3]
    league_sub = league_subs[(rank - 1) % 3] if rank < 19 else ""

    return f"{league} {league_sub}".strip()

# Example usage
for rank in range(1, 20):
    print(f"{rank} -> {format_league_ranks(rank)}")

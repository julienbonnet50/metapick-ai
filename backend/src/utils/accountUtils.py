from collections import defaultdict
import sys
import os
from typing import Any, Dict

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from src.model.BrawlerUpgrade import BrawlerUpgrade
from src.utils import battlesUtils


def aggregate_scores(data: Any) -> Dict[str, float]:
    """
    Aggregates the scores for each brawler in the given data.

    Args:
    data: The data structure containing the brawlers and their scores.

    Returns:
    A dictionary where keys are brawler names and values are their corresponding aggregated scores.
    """
    brawler_scores = defaultdict(float)  # Using defaultdict to sum scores

    # Loop through the data and aggregate scores for each brawler
    for map_data in data:
        for brawler in map_data["tierList"]:
            brawler_name = brawler[0]
            score = brawler[1]
            brawler_scores[brawler_name] += score  # Sum the scores for each brawler

    return brawler_scores  # Return the dictionary with aggregated scores


def get_cost_and_score_by_account(player_tag, data, api_key, base_url):
    accountStats = battlesUtils.get_account_brawlers(
        player_tag=player_tag, API_KEY=api_key, BASE_URL=base_url
    )

    accountBrawlers = accountStats["brawlers"]
    sorted_scores = aggregate_scores(data)
    res = []
    for accountBrawler in accountBrawlers:
        if accountBrawler["power"] == 11:
            continue
        name = battlesUtils.check_brawler_name(accountBrawler["name"])
        brawler_upgrade = BrawlerUpgrade(
            name=name,
            current_power=accountBrawler["power"],
            gears=accountBrawler["gears"],
            star_powers=accountBrawler["starPowers"],
            gadgets=accountBrawler["gadgets"],
        )
        brawler_upgrade.calculate_upgrade_cost()
        res.append(
            {
                "name": name,
                "score": sorted_scores.get(name),
                "total_power_points": brawler_upgrade.total_power_points,
                "total_coins": brawler_upgrade.total_coins,
            }
        )
    return res

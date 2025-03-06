import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from concurrent.futures import ThreadPoolExecutor
from backend.src.service import PostgreService
from backend.src.utils.jsonUtils import read_json
import backend.src.utils.battlesUtils as battlesUtils
from backend.src.config import AppConfig

# Main variables
appConfig = AppConfig.AppConfig()
postgreService = PostgreService.PostgreService(appConfig=appConfig)
max_threads = 40
processed_players = 0

# Data
brawlerData = read_json("./backend/data/brawlersMaps.json")
brawler_map = {brawler['id']: brawler for brawler in brawlerData['brawlers']}

# Main
players = postgreService.get_all_players_from_rank(15, "above")
postgreService.create_battles_table_version(appConfig.game_version)

total_players = len(players)
progress_step = max(1, total_players // 100)  # Ensure at least 1 step

print("Start battles retriever for " + str(total_players) + " players")

with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(battlesUtils.get_all_battles_from_tag,  player[0], postgreService, brawler_map, appConfig.API_KEY, appConfig.BASE_URL) for player in players]
    # Wait for all futures to complete
    for future in futures:
        future.result()
        processed_players += 1
        if processed_players % progress_step == 0 or processed_players == total_players:
            print(f"Progress: {processed_players}/{total_players} ({(processed_players / total_players) * 100:.0f}%)")
    print("job finished")


# # Test with my own tag
# with ThreadPoolExecutor(max_workers=max_threads) as executor:
#     futures = [executor.submit(battlesUtils.get_all_battles_from_tag, appConfig.OWN_PLAYER_TAG, postgreService, brawler_map, appConfig.API_KEY, appConfig.BASE_URL)]
#     # Wait for all futures to complete
#     for future in futures:
#         future.result()
#     print("job finished")
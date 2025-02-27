# Necessary import
import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))

import src.service.PostgreService as PostgreService
import src.config.AppConfig as AppConfig
import src.utils.battlesUtils as battlesUtils
from concurrent.futures import ThreadPoolExecutor


appConfig = AppConfig.AppConfig()

postgreService = PostgreService.PostgreService(appConfig=appConfig)

brawlerData = battlesUtils.read_json("data/brawlersMaps.json")
brawler_map = {brawler['id']: brawler for brawler in brawlerData['brawlers']}
max_threads = 20


players = postgreService.get_all_players_from_rank(15, "below")

print("Start battles retriever")

with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(battlesUtils.get_all_battles_from_tag,  player[0], postgreService, brawler_map, appConfig.API_KEY, appConfig.BASE_URL) for player in players]
    # Wait for all futures to complete
    for future in futures:
        future.result()
    print("job finished")
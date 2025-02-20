# Necessary import
import sys
import os
# Add the src directory to the Python path
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
import src.config.AppConfig as AppConfig
import src.utils.battlesUtils as battlesUtils
import src.service.PostgreService as PostgreService
from typing import *
from concurrent.futures import ThreadPoolExecutor


appConfig = AppConfig.AppConfig()

postgreService = PostgreService.PostgreService(appConfig=appConfig)

brawlerData = battlesUtils.read_json("data/brawlers.json")
brawler_map = {brawler['id']: brawler for brawler in brawlerData['brawlers']}

players = postgreService.get_all_players_from_rank(15, "above")
max_threads = 20

print("Start player retriever")

with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(battlesUtils.get_all_players_from_tag, player[0], postgreService, brawler_map, appConfig.API_KEY, appConfig.BASE_URL) for player in players]
    # Wait for all futures to complete
    for future in futures:
        future.result()
    print("job finished")


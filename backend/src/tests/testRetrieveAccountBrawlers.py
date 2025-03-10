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
import json 
import requests

# Main variables
appConfig = AppConfig.AppConfig()

def get_brawlers_with_high_power(data):
    # Initialize an empty list to store the names of brawlers with power greater than 10
    brawlers_with_high_power = []
    
    # Iterate over each brawler in the brawlers list
    for brawler in data['brawlers']:
        # Check if the brawler's power is greater than 9 and got at least 1 stars Power
        if brawler['power'] > 9 and brawler['starPowers'] != []:
            # If it is, append the brawler's name to the result list
            brawlers_with_high_power.append(brawler['name'])
    
    return brawlers_with_high_power

data = battlesUtils.get_account_brawlers("CJLPY29V", appConfig.API_KEY, appConfig.BASE_URL)

# Calling the function
result = battlesUtils.get_brawlers_with_high_power(data)
print(result)
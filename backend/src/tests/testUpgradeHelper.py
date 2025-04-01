from collections import defaultdict
import sys
import os
from typing import Any, Dict
import pandas as pd

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from backend.src.utils.accountUtils import (
    BrawlerUpgrade,
    aggregate_scores,
    get_cost_and_score_by_account,
)
from concurrent.futures import ThreadPoolExecutor
from backend.src.service import PostgreService
from backend.src.utils.jsonUtils import read_json
import backend.src.utils.battlesUtils as battlesUtils
from backend.src.config import AppConfig
import json
import requests

# Main variables
appConfig = AppConfig.AppConfig()

print(
    get_cost_and_score_by_account(
        data=appConfig.data_tier_list,
        player_tag=appConfig.OWN_PLAYER_TAG,
        api_key=appConfig.API_KEY,
        base_url=appConfig.BASE_URL,
    )
)

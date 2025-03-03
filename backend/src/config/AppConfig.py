import json
import os
import sys
from dotenv import load_dotenv
from src.utils.jsonUtils import read_json
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

class AppConfig:
    def __init__(self):
        load_dotenv()
        self.BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.API_KEY = os.getenv("API_KEY", "")
        self.POSTGRE_SQL_PASSWORD = os.getenv("POSTGRE_SQL_PASSWORD", "")
        self.BASE_URL = "https://api.brawlstars.com/v1"
        self.OWN_PLAYER_TAG =  os.getenv("OWN_PLAYER_TAG")
        self.logs_level = int(os.getenv("LOGS_LEVEL", "1"))
        self.port = int(os.environ.get("PORT", 10000))

        self.data_game_version = None
        self.dataIndex = None
        self.dataVersion = None
        self.dataMaps = None
        self.game_version = None
        
        self.initApp()
        
    def initApp(self):
        # Load data from JSON file
        data_index_path = os.path.join(self.BASE_DIR, "data", "brawlersMaps.json")
        with open(data_index_path, 'r') as file:
            self.dataIndex = json.load(file)

        self.setBrawler()
        self.setDataGameVersion()
        self.setLatestGameVersion()

        for version in self.data_game_version:
            if version['version'] == self.game_version:
                self.dataMaps = version['ranked_maps']

    def setBrawler(self):
        brawlers = []
        for brawler in self.dataIndex['brawlers']:
            if brawler['name'] == "Buzz Lightyear":
                pass
            elif brawler['name'] == "Larry & Lawrie":
                brawler['name'] = "Larry & L"
                brawlers.append(brawler)
            else:
                brawlers.append(brawler)

        # Set brawlers updated
        self.dataIndex['brawlers'] = brawlers
        pass

    def setDataGameVersion(self):
        # Load data from JSON file
        game_version_path = os.path.join(self.BASE_DIR, "data", "game_version.json")

        with open(game_version_path, 'r') as file:
            self.data_game_version = json.load(file)

    def setLatestGameVersion(self):
        # Sort by version number in descending order
        latest_version = max(self.data_game_version, key=lambda x: x["date"])
        self.game_version = latest_version["version"]
        print(f"Latest game version: {self.game_version}")


            

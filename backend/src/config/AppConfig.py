import json
import os
from dotenv import load_dotenv
from backend.src.utils.battlesUtils import read_json

class AppConfig:
    def __init__(self, versionTag="35"):
        load_dotenv()
        self.API_KEY = os.getenv("API_KEY")
        self.POSTGRE_SQL_PASSWORD = os.getenv("POSTGRE_SQL_PASSWORD")
        self.BASE_URL = "https://api.brawlstars.com/v1"
        self.OWN_PLAYER_TAG =  os.getenv("OWN_PLAYER_TAG")
        self.version = read_json("data/game_version.json")
        self.versionTag = versionTag
        self.logs_level = int(os.getenv("LOGS_LEVEL"))

        self.dataIndex = None
        self.dataVersion = None
        self.dataMaps = None

        self.initApp()

    def initApp(self):
        # Load data from JSON file
        with open('./data/brawlersMaps.json', 'r') as file:
            self.dataIndex = json.load(file)

        self.setBrawler()

        for versionElem in self.version:
            if versionElem['version'] == self.versionTag:
                self.dataMaps = versionElem['ranked_maps']

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
            

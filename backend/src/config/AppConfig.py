import json
import os
import pickle
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))


class AppConfig:
    def __init__(self):
        load_dotenv()
        self.logs_level = int(os.getenv("LOGS_LEVEL", "1"))

        # Base app
        self.MODE = os.getenv("MODE", "IMPORT")
        self.BASE_DIR = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        self.API_KEY = os.getenv("API_KEY", "")
        self.POSTGRE_SQL_PASSWORD = os.getenv("POSTGRE_SQL_PASSWORD", "")
        self.BASE_URL = "https://api.brawlstars.com/v1"
        self.OWN_PLAYER_TAG = os.getenv("OWN_PLAYER_TAG")

        # Network
        self.GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
        self.GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.FLASK_ENV = os.getenv("FLASK_ENV", "local")
        self.REDIRECT_URI = os.getenv(
            "REDIRECT_URI", "http://localhost:10000/auth/google"
        )
        self.SECRET_KEY = os.getenv("SECRET_KEY", "secret")

        self.origins = []

        self.origins.append(os.getenv("ORIGIN", "*"))
        self.port = int(os.environ.get("PORT", 10000))

        self.data_game_version = None
        self.data_all_game_version = None
        self.data_index = None
        self.data_version = None
        self.data_maps = None
        self.game_version = None
        self.data_tier_list = None
        self.battle_stats = None

        self.initApp()
        self.resolveMaps()

    def initApp(self):
        # Load data from JSON file
        self.setDataIndex()
        self.setBrawler()
        self.setDataMaps()
        self.setDataGameVersion()
        self.setLatestGameVersion()

        if self.MODE and self.MODE != "IMPORT":
            self.setTierList()
            self.setBattleStatsData()

    def setBattleStatsData(self):
        battle_stats_path = os.path.join(
            self.BASE_DIR, "data", "model", f"version_{self.game_version}", "stats.pkl"
        )
        with open(battle_stats_path, "rb") as f:
            self.battle_stats = pickle.load(f)
            print("Successfully loaded stats")

    def setTierList(self):
        tierlist_path = os.path.join(
            self.BASE_DIR,
            "data",
            "model",
            f"version_{self.game_version}",
            "tierlist.json",
        )
        with open(tierlist_path, "r") as file:
            self.data_tier_list = json.load(file)
            print("Successfully loaded tierlist")

    def setDataIndex(self):
        data_index_path = os.path.join(self.BASE_DIR, "data", "brawlersMaps.json")
        with open(data_index_path, "r") as file:
            self.data_index = json.load(file)

    ##### MAPS #####

    def resolveMaps(self):
        currentRankedMaps = []
        insertedMapNames = set()

        for map in self.data_maps:
            mapName = map["name"]

            if mapName not in insertedMapNames:
                for currentRankedMap in self.data_game_version["ranked_maps"]:
                    if mapName.lower() == currentRankedMap.lower():
                        mapsToAdd = {
                            "name": mapName,
                            "gameMode": map["gameMode"]["name"],
                            "imageUrl": map["imageUrl"],
                        }

                        currentRankedMaps.append(mapsToAdd)
                        insertedMapNames.add(mapName)
                        break

        print("Current ranked maps resolved:", len(currentRankedMaps))
        self.data_maps = currentRankedMaps

    def setDataMaps(self):
        # Load data from JSON file
        data_maps_path = os.path.join(self.BASE_DIR, "data", "maps.json")

        with open(data_maps_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            self.data_maps = data["maps"]

    def setBrawler(self):
        brawlers = []
        for brawler in self.data_index["brawlers"]:
            if brawler["name"] == "Buzz Lightyear":
                pass
            elif brawler["name"] == "Larry & Lawrie":
                brawler["name"] = "Larry & L"
                brawlers.append(brawler)
            else:
                brawlers.append(brawler)

        # Set brawlers updated
        self.data_index["brawlers"] = brawlers
        pass

    def setDataGameVersion(self):
        # Load data from JSON file
        game_version_path = os.path.join(self.BASE_DIR, "data", "game_version.json")

        with open(game_version_path, "r") as file:
            self.data_all_game_version = json.load(file)

    def setLatestGameVersion(self):
        # Sort by version number in descending order
        latest_version = max(self.data_all_game_version, key=lambda x: x["date"])
        self.data_game_version = latest_version
        self.game_version = latest_version["version"]
        print(f"Latest game version: {self.game_version}")

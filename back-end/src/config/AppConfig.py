import os
from dotenv import load_dotenv

class AppConfig:
    def __init__(self):
        load_dotenv()
        self.API_KEY = os.getenv("API_KEY")
        self.POSTGRE_SQL_PASSWORD = os.getenv("POSTGRE_SQL_PASSWORD")
        self.BASE_URL = "https://api.brawlstars.com/v1"
        self.OWN_PLAYER_TAG =  os.getenv("OWN_PLAYER_TAG")

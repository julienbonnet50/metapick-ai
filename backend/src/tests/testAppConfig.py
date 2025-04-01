import sys
import os

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from concurrent.futures import ThreadPoolExecutor
from backend.src.service import PostgreService
from backend.src.utils.jsonUtils import read_json
import backend.src.utils.battlesUtils as battlesUtils
from backend.src.config import AppConfig

# Main variables
appConfig = AppConfig.AppConfig()

print(appConfig)

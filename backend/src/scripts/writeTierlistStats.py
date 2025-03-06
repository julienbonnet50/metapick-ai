import json
import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.src.service import NeuralNetworkService
import backend.src.config.AppConfig as AppConfig

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

appConfig = AppConfig.AppConfig()

# Construct the correct paths using BASE_DIR
data_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "mappings.pkl")
stats_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "stats.pkl")
model_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "nn_model_all.pth")
tierlist_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "tierlist.json")

neuralNetworkService = NeuralNetworkService.NeuralNetworkService(data_path=data_path, 
                                                                 model_path=model_path, 
                                                                 version=appConfig.game_version,
                                                                 appConfig=appConfig)



neuralNetworkService.write_tier_list(tierlist_path)
neuralNetworkService.save_stats_battle(stats_path)
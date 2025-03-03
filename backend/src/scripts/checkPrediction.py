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

version = "35_2"

# Construct the correct paths using BASE_DIR
data_path = os.path.join(BASE_DIR, "data", "model", f"version_{version}", "mappings.pkl")
model_path = os.path.join(BASE_DIR, "data", "model", f"version_{version}", "nn_model_all.pth")


neuralNetworkService = NeuralNetworkService.NeuralNetworkService(data_path=data_path, 
                                                                 model_path=model_path, 
                                                                 version=version,
                                                                 appConfig=appConfig)


mapName = 'Center Stage'
excluded_brawlers = ['DYNAMIKE', 'MORTIS']
friend_brawlers = ['SPIKE']
enemy_brawlers = ['AMBER']

print(neuralNetworkService.predict_best_brawler(friends=friend_brawlers, enemies=enemy_brawlers, map_name=mapName, excluded=excluded_brawlers))


mapName = 'Center Stage'
friend_brawlers = ['SPIKE', 'MORTIS', 'DYNAMIKE']
enemy_brawlers = ['AMBER', 'GUS', 'RICO']

print(neuralNetworkService.predict_winrate(friends=friend_brawlers, enemies=enemy_brawlers, map_name=mapName))  
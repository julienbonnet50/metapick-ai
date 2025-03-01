import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
from backend.src.service import NeuralNetworkService
import backend.src.config.AppConfig as AppConfig


appConfig = AppConfig.AppConfig()

version = "35_1"

neuralNetworkService = NeuralNetworkService.NeuralNetworkService(data_path=f"data/model/version_{version}/data_all.pkl", 
                                                                 model_path=f"./data/model/version_{version}/nn_model_all.pth", 
                                                                 version=version,
                                                                 appConfig=appConfig)

# Load or initialize data
neuralNetworkService.load_data()
neuralNetworkService.load_model(num_friends=3, num_enemies=3)

# # Train the model
# neuralNetworkService.train_model(num_epochs=15, batch_size=64, num_friends=3, num_enemies=3)


friends = []
enemies = []
map_name = "Below Zero"
excluded = []
predictions = neuralNetworkService.predict_best_brawler(friends, enemies, map_name, excluded=excluded)
print("Top predictions:", predictions)

# # Train model
# neuralNetworkService.train_model(num_epochs=15, batch_size=64)
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

# Load or initialize data

# # Train the model
# neuralNetworkService.train_model(num_epochs=15, batch_size=64, num_friends=3, num_enemies=3)
neuralNetworkService.save_mappings(neuralNetworkService.data_path)

friends = []
enemies = []
map_name = "Below Zero"
excluded = []
predictions = neuralNetworkService.predict_best_brawler(friends, enemies, map_name, excluded=excluded)
print("Top predictions:", predictions)

# # Train model
# neuralNetworkService.train_model(num_epochs=15, batch_size=64)
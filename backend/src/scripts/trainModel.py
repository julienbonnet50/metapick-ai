import os
import sys

sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
from backend.src.service import NeuralNetworkService, PostgreService
import backend.src.config.AppConfig as AppConfig

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["MODE"] = "IMPORT"
appConfig = AppConfig.AppConfig()

# Construct the correct paths using BASE_DIR
data_path = os.path.join(
    BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "mappings.pkl"
)

model_path = os.path.join(
    BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "nn_model_all.pth"
)

tierlist_path = os.path.join(
    BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "tierlist.json"
)

stats_path = os.path.join(
    BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "stats.pkl"
)

game_version_path = os.path.join(BASE_DIR, "data", "game_version.json")

postgreService = PostgreService.PostgreService(appConfig=appConfig)

neuralNetworkService = NeuralNetworkService.NeuralNetworkService(
    data_path=data_path,
    model_path=model_path,
    version=appConfig.game_version,
    appConfig=appConfig,
    auto_load_enable=False,
)

# Train the model
neuralNetworkService.train_model(
    num_epochs=10, batch_size=64, num_friends=3, num_enemies=3
)
neuralNetworkService.save_mappings(neuralNetworkService.data_path)
neuralNetworkService.write_tier_list(tierlist_path)
neuralNetworkService.save_stats_battle(stats_path)
neuralNetworkService.save_counter_matrix()

# Apply modification to game_version.json
postgreService.update_game_version(appConfig.game_version, game_version_path)

# Test a random prediction
friends = []
enemies = []
map_name = "Below Zero"
excluded = []
predictions = neuralNetworkService.predict_best_brawler(
    friends, enemies, map_name, excluded=excluded
)

print("Top predictions:", predictions)

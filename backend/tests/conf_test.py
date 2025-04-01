import os
import sys
import pytest
from unittest.mock import MagicMock, patch

# Add the parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Create pytest fixtures that can be reused across tests
@pytest.fixture
def mock_neural_network_service():
    """Create a mock for the neural network service."""
    mock = MagicMock()
    mock.predict_best_brawler.return_value = [
        ("SHELLY", 0.95),
        ("COLT", 0.85),
        ("BULL", 0.75),
        ("JESSIE", 0.70),
        ("BROCK", 0.65),
        ("DYNAMIKE", 0.60),
        ("BO", 0.55),
        ("EL PRIMO", 0.50),
        ("BARLEY", 0.45),
        ("POCO", 0.40),
    ]
    mock.predict_winrate.return_value = 0.65
    return mock


@pytest.fixture
def mock_app_config():
    """Create a mock for the app config."""
    mock = MagicMock()
    mock.data_index = {
        "brawlers": [
            {"name": "SHELLY", "imageUrl": "https://example.com/shelly.png"},
            {"name": "COLT", "imageUrl": "https://example.com/colt.png"},
            {"name": "BULL", "imageUrl": "https://example.com/bull.png"},
        ],
        "maps": ["Gem Grab", "Brawl Ball", "Showdown"],
    }
    mock.data_maps = ["Gem Grab", "Brawl Ball", "Showdown"]
    mock.data_game_version = ["1.0", "1.1", "1.2"]
    mock.data_tier_list = [
        {"mapName": "Gem Grab", "tierList": {"S": ["SHELLY"], "A": ["COLT"]}}
    ]
    mock.logs_level = 0

    # Create a mock DataFrame for battle_stats
    battle_stats_mock = MagicMock()
    battle_stats_mock.__getitem__.return_value = battle_stats_mock
    battle_stats_mock.__eq__.return_value = battle_stats_mock
    battle_stats_mock.to_dict.return_value = [
        {"map": "Gem Grab", "brawler": "SHELLY", "winRate": 0.65}
    ]
    mock.battle_stats = battle_stats_mock

    return mock

import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, neuralNetworkService, appConfig


class TestFlaskApp(unittest.TestCase):
    """Test cases for the Flask application."""

    def setUp(self):
        """Set up test client and other test variables."""
        self.app = app.test_client()
        self.app.testing = True

        # Mock data for tests
        self.mock_brawlers = [
            {"name": "SHELLY", "imageUrl": "https://example.com/shelly.png"},
            {"name": "COLT", "imageUrl": "https://example.com/colt.png"},
        ]

        self.mock_maps = ["Gem Grab", "Brawl Ball", "Showdown"]

        self.mock_top10_brawlers = [("SHELLY", 0.9876), ("COLT", 0.8765)]

        self.mock_tier_list = [
            {"mapName": "Gem Grab", "tierList": {"S": ["SHELLY"], "A": ["COLT"]}}
        ]

        self.mock_game_versions = ["1.0", "1.1", "1.2"]

        self.mock_stats = [{"map": "Gem Grab", "brawler": "SHELLY", "winRate": 0.65}]

        self.mock_account_brawlers = ["SHELLY", "COLT"]

        self.mock_upgrade_helper = {
            "brawlers": [{"name": "SHELLY", "powerLevel": 9, "upgradeCost": 1000}]
        }

    def test_index_route(self):
        """Test the index route."""
        with patch.object(
            appConfig,
            "data_index",
            {"brawlers": self.mock_brawlers, "maps": self.mock_maps},
        ):
            response = self.app.get("/")
            self.assertEqual(response.status_code, 200)

    def test_get_brawlers(self):
        """Test the get_brawlers endpoint."""
        with patch.object(appConfig, "data_index", {"brawlers": self.mock_brawlers}):
            response = self.app.get("/get_brawlers")
            self.assertEqual(response.status_code, 200)

    def test_get_maps(self):
        """Test the get_maps endpoint."""
        with patch.object(appConfig, "data_maps", self.mock_maps):
            response = self.app.get("/get_maps")
            self.assertEqual(response.status_code, 200)

    def test_get_game_versions(self):
        """Test the get_game_versions endpoint."""
        with patch.object(appConfig, "data_game_version", self.mock_game_versions):
            response = self.app.get("/get_game_versions")
            self.assertEqual(response.status_code, 200)

    def test_simulate_draft(self):
        """Test the simulate_draft endpoint."""
        with patch.object(
            neuralNetworkService,
            "predict_best_brawler",
            return_value=self.mock_top10_brawlers,
        ):
            with patch.object(
                appConfig, "data_index", {"brawlers": self.mock_brawlers}
            ):
                with patch.object(appConfig, "logs_level", 0):
                    data = {
                        "map": "Gem Grab",
                        "available_brawlers": ["SHELLY", "COLT"],
                        "excluded_brawlers": [],
                        "initial_team": ["SHELLY"],
                        "initial_opponent": ["COLT"],
                    }
                    response = self.app.post(
                        "/simulate_draft", json=data, content_type="application/json"
                    )
                    self.assertEqual(response.status_code, 200)

    def test_predict_winrate(self):
        """Test the predict_winrate endpoint."""
        with patch.object(neuralNetworkService, "predict_winrate", return_value=0.67):
            with patch.object(appConfig, "logs_level", 0):
                data = {
                    "map": "Gem Grab",
                    "initial_team": ["SHELLY"],
                    "initial_opponent": ["COLT"],
                }
                response = self.app.post(
                    "/predict_winrate", json=data, content_type="application/json"
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data.decode(), "0.67")

    def test_tier_list(self):
        """Test the tier_list endpoint."""
        with patch.object(appConfig, "data_tier_list", self.mock_tier_list):
            data = {"map": "Gem Grab"}
            response = self.app.post(
                "/tier_list", json=data, content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

    def test_stats(self):
        """Test the stats endpoint."""
        mock_df = MagicMock()
        mock_df.__getitem__.return_value = mock_df
        mock_df.__eq__.return_value = mock_df
        mock_df.to_dict.return_value = self.mock_stats

        with patch.object(appConfig, "battle_stats", mock_df):
            data = {"map": "Gem Grab"}
            response = self.app.post(
                "/stats", json=data, content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

    def test_account(self):
        """Test the account endpoint."""
        with patch("app.battlesUtils.get_account_brawlers", return_value={}):
            with patch(
                "app.battlesUtils.get_brawlers_with_high_power",
                return_value=self.mock_account_brawlers,
            ):
                data = {"player_tag": "12345"}
                response = self.app.post(
                    "/account", json=data, content_type="application/json"
                )
                self.assertEqual(response.status_code, 200)

    def test_account_upgrade_helper(self):
        """Test the account-upgrade-helper endpoint."""
        with patch(
            "app.accountUtils.get_cost_and_score_by_account",
            return_value=self.mock_upgrade_helper,
        ):
            data = {"player_tag": "12345"}
            response = self.app.post(
                "/account-upgrade-helper", json=data, content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

    def test_error_handling_simulate_draft(self):
        """Test error handling in simulate_draft endpoint."""
        with patch.object(
            neuralNetworkService,
            "predict_best_brawler",
            side_effect=Exception("Test error"),
        ):
            data = {
                "map": "Gem Grab",
                "available_brawlers": ["SHELLY"],
                "excluded_brawlers": [],
                "initial_team": ["SHELLY"],
                "initial_opponent": ["COLT"],
            }
            response = self.app.post(
                "/simulate_draft", json=data, content_type="application/json"
            )
            self.assertEqual(response.status_code, 500)

    def test_error_handling_predict_winrate(self):
        """Test error handling in predict_winrate endpoint."""
        with patch.object(
            neuralNetworkService, "predict_winrate", side_effect=Exception("Test error")
        ):
            data = {
                "map": "Gem Grab",
                "initial_team": ["SHELLY"],
                "initial_opponent": ["COLT"],
            }
            response = self.app.post(
                "/predict_winrate", json=data, content_type="application/json"
            )
            self.assertEqual(response.status_code, 500)


if __name__ == "__main__":
    unittest.main()

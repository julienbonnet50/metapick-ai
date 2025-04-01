import os
import sys
import unittest
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, neuralNetworkService, appConfig


class TestIntegration(unittest.TestCase):
    """Integration tests for the Flask application."""

    def setUp(self):
        """Set up test client and other test variables."""
        self.app = app.test_client()
        self.app.testing = True

    @patch("src.service.NeuralNetworkService.NeuralNetworkService.predict_best_brawler")
    @patch("src.service.NeuralNetworkService.NeuralNetworkService.predict_winrate")
    def test_draft_and_winrate_flow(
        self, mock_predict_winrate, mock_predict_best_brawler
    ):
        """Test the full flow of selecting brawlers and predicting winrate."""
        # Mock the neural network responses
        mock_predict_best_brawler.return_value = [("SHELLY", 0.95), ("COLT", 0.85)]
        mock_predict_winrate.return_value = 0.65

        # Mock necessary configuration data
        test_brawlers = [
            {"name": "SHELLY", "imageUrl": "https://example.com/shelly.png"},
            {"name": "COLT", "imageUrl": "https://example.com/colt.png"},
        ]

        with patch.object(appConfig, "data_index", {"brawlers": test_brawlers}):
            with patch.object(appConfig, "logs_level", 0):
                # Step 1: Simulate draft to get recommended brawlers
                draft_data = {
                    "map": "Gem Grab",
                    "available_brawlers": ["SHELLY", "COLT"],
                    "excluded_brawlers": [],
                    "initial_team": [],
                    "initial_opponent": ["BULL"],
                }

                draft_response = self.app.post(
                    "/simulate_draft", json=draft_data, content_type="application/json"
                )
                self.assertEqual(draft_response.status_code, 200)

                draft_result = json.loads(draft_response.data)
                # Check that we got recommendations back
                self.assertTrue(len(draft_result) > 0)

                # Extract the top recommended brawler
                recommended_brawler = draft_result[0][0][0]

                # Step 2: Use the recommended brawler to predict winrate
                winrate_data = {
                    "map": "Gem Grab",
                    "initial_team": [recommended_brawler],
                    "initial_opponent": ["BULL"],
                }

                winrate_response = self.app.post(
                    "/predict_winrate",
                    json=winrate_data,
                    content_type="application/json",
                )
                self.assertEqual(winrate_response.status_code, 200)

                # Check that we got a winrate prediction
                winrate = float(winrate_response.data.decode())
                self.assertEqual(winrate, 0.65)

    @patch("app.battlesUtils.get_account_brawlers")
    @patch("app.battlesUtils.get_brawlers_with_high_power")
    @patch("app.accountUtils.get_cost_and_score_by_account")
    def test_account_upgrade_flow(
        self, mock_get_cost, mock_get_high_power, mock_get_account
    ):
        """Test the flow of fetching account data and upgrade recommendations."""
        # Mock the responses
        mock_get_account.return_value = {
            "SHELLY": {"powerLevel": 9},
            "COLT": {"powerLevel": 7},
        }
        mock_get_high_power.return_value = ["SHELLY"]
        mock_get_cost.return_value = {
            "totalCost": 5000,
            "recommendations": [
                {"brawler": "COLT", "currentPower": 7, "targetPower": 9, "cost": 2000}
            ],
        }

        # Step 1: Get account brawlers
        account_data = {"player_tag": "12345"}
        account_response = self.app.post(
            "/account", json=account_data, content_type="application/json"
        )
        self.assertEqual(account_response.status_code, 200)

        # Step 2: Get upgrade recommendations
        upgrade_response = self.app.post(
            "/account-upgrade-helper",
            json=account_data,
            content_type="application/json",
        )
        self.assertEqual(upgrade_response.status_code, 200)

        upgrade_result = json.loads(upgrade_response.data)
        self.assertIn("totalCost", upgrade_result)
        self.assertIn("recommendations", upgrade_result)


if __name__ == "__main__":
    unittest.main()

import json
import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
import re
import time
from flask import Flask, jsonify, request, render_template, send_from_directory
import pandas as pd
from flask_cors import CORS

from src.config.AppConfig import AppConfig
from src.service import NeuralNetworkService

import os

# Get the absolute path to the project root directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# TODO: Remove for production

# Replace with : CORS(app, resources={r"/*": {"origins": "https://metapick-ai.vercel.app"}})
CORS(app, resources={r"/*": {"origins": "*"}})
appConfig = AppConfig()


# Construct the correct paths using BASE_DIR
data_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "mappings.pkl")
model_path = os.path.join(BASE_DIR, "data", "model", f"version_{appConfig.game_version}", "nn_model_all.pth")

# Check if files exist (debugging)
if not os.path.exists(data_path):
    raise FileNotFoundError(f"Data file not found: {data_path}")
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found: {model_path}")

print("All required files found!")


neuralNetworkService = NeuralNetworkService.NeuralNetworkService(data_path=data_path, 
                                                                 model_path=model_path, 
                                                                 version=appConfig.game_version,
                                                                 appConfig=appConfig)

@app.route('/')
def index():
    brawlersName = []
    brawlerImgUrl = []
    for brawler in appConfig.dataIndex['brawlers']:
        brawlersName.append(brawler['name'])
        brawlerImgUrl.append(brawler['imageUrl'])

    brawlers = list(zip(brawlersName, brawlerImgUrl))

    return render_template('index.html', maps=appConfig.dataIndex['maps'], brawlers=brawlers)

@app.route('/get_brawlers', methods=['GET'])
def get_brawlers(): 
    return appConfig.dataIndex['brawlers']
    
@app.route('/get_maps', methods=['GET'])
def get_maps(): 
    return appConfig.dataMaps
    

@app.route('/simulate_draft', methods=['POST'])
def simulate_draft():
    try: 
        startTime = int(round(time.time() * 1000))
        # Extract parameters from the request body
        data = request.get_json()
        mapName = data.get('map', '')
        
        # Use getlist() to retrieve all values for multi-select fields
        excluded_brawlers = [b.strip().upper() for b in data.get('excluded_brawlers')]
        friend_brawlers = [b.strip().upper() for b in data.get('initial_team')]
        enemy_brawlers = [b.strip().upper() for b in data.get('initial_opponent')]

        # Get predictions
        top10_brawlers = neuralNetworkService.predict_best_brawler(friend_brawlers, enemy_brawlers, mapName, excluded_brawlers)

        brawlerImgUrl = []
        for brawler in top10_brawlers:
            for brawlerRaw in appConfig.dataIndex['brawlers']:
                if brawler[0] == brawlerRaw['name'].upper():
                    brawlerImgUrl.append(brawlerRaw['imageUrl'])

        response = list(zip(top10_brawlers, brawlerImgUrl))

        # Display results
        if appConfig.logs_level > 0:
            print("============ /simulate_draft response ============")
            print(f"Map : {mapName}")
            print(f"Excluded Brawlers : {excluded_brawlers}")
            print(f"Friend Brawlers : {friend_brawlers}")
            print(f"Enemy Brawlers : {enemy_brawlers}")
            print("Top 10 Recommended Brawlers:")
            for brawler, prob in top10_brawlers:
                print(f"{brawler}: {prob:.4f}")
            print("in ", int(round(time.time() * 1000)) - startTime, "ms")

        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=appConfig.port)

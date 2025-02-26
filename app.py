import json
import re
import time
from flask import Flask, jsonify, request, render_template, send_from_directory
import pandas as pd
from flask_cors import CORS

import src.service.DraftService2 as DraftService2


app = Flask(__name__)

# TODO: Remove for production
# Replace '*' by my dns
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize the DraftService
draft_service2 = DraftService2.DraftService2(data_path="./data/model/data_all.pkl", model_path="./data/model/nn_model_all.pth")

# Load data from JSON file
with open('./data/brawlersMaps.json', 'r') as file:
    dataIndex = json.load(file)

@app.route('/')
def index():
    brawlersName = []
    brawlerImgUrl = []
    for brawler in dataIndex['brawlers']:
        brawlersName.append(brawler['name'])
        brawlerImgUrl.append(brawler['imageUrl'])

    brawlers = list(zip(brawlersName, brawlerImgUrl))

    return render_template('index.html', maps=dataIndex['maps'], brawlers=brawlers)

@app.route('/get_brawlers', methods=['GET'])
def get_brawlers(): 
    return dataIndex['brawlers']
    
@app.route('/get_maps', methods=['GET'])
def get_maps(): 
    return dataIndex['maps']
    

@app.route('/simulate_draft', methods=['POST'])
def simulate_draft():
    startTime = int(round(time.time() * 1000))
    # Extract parameters from the request body
    data = request.form
    mapString = data.get('map', '')
    firstpick = data.get('firstpick')
    # Use getlist() to retrieve all values for multi-select fields
    excluded_brawlers = [b.strip().upper() for b in data.getlist('excluded_brawlers')]
    friend_brawlers = [b.strip().upper() for b in data.getlist('initial_team')]
    enemy_brawlers = [b.strip().upper() for b in data.getlist('initial_opponent')]
    # Define the regex pattern to match the map name within single quotes
    pattern = r"\'([^\']+)\'"


    # Search for the pattern in the input string
    match = re.search(pattern, mapString)
    mapName = ''

    # Check if a match is found and extract the map name
    if match:
        mapName = match.group(1)

    # Run the draft simulation using the DraftService
    try:

        # Get predictions
        top10_brawlers = draft_service2.predict_best_brawler(friend_brawlers, enemy_brawlers, mapName, excluded_brawlers)

        brawlerImgUrl = []
        for brawler in top10_brawlers:
            for brawlerRaw in dataIndex['brawlers']:
                if brawler[0] == brawlerRaw['name'].upper():
                    brawlerImgUrl.append(brawlerRaw['imageUrl'])

        response = list(zip(top10_brawlers, brawlerImgUrl))

        # Display results
        print("Context : ")
        print(f"Map : {mapName}")
        print(f"First Pick : {firstpick}")
        print(f"Excluded Brawlers : {excluded_brawlers}")
        print(f"Friend Brawlers : {friend_brawlers}")
        print(f"Enemy Brawlers : {enemy_brawlers}")
        print("Top 10 Recommended Brawlers:")
        for brawler, prob in top10_brawlers:
            print(f"{brawler}: {prob:.4f}")
        print("in ", int(round(time.time() * 1000)) - startTime, "ms")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response)

@app.route('/get_top15_brawlers', methods=['POST'])
def get_top15_brawlers():
    mapName = request.form.get('map')
    top10_brawlers = draft_service2.predict_best_brawler([],  [], mapName, [])

    brawlerImgUrl = []
    for brawler in top10_brawlers:
        for brawlerRaw in dataIndex['brawlers']:
            if brawler[0] == brawlerRaw['name'].upper():
                brawlerImgUrl.append(brawlerRaw['imageUrl'])

    reponse = list(zip(top10_brawlers, brawlerImgUrl))

    return jsonify(reponse)

if __name__ == '__main__':
    app.run(debug=True)

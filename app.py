import json
from flask import Flask, jsonify, request, render_template, send_from_directory
import pandas as pd

import src.service.DraftService as DraftService


app = Flask(__name__)

# Initialize the DraftService
draft_service = DraftService.DraftService()

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

@app.route('/simulate_draft', methods=['POST'])
def simulate_draft():
    # Extract parameters from the request body
    data = request.form
    map_name = data.get('map', '')[0]
    excluded_brawlers = [b.strip() for b in data.get('excluded_brawlers', "").upper().split(',')]
    initial_team = [b.strip() for b in data.get('initial_team', "").upper().split(',')]
    initial_opponent = [b.strip() for b in data.get('initial_opponent', "").upper().split(',')]

    # Run the draft simulation using the DraftService
    try:
        result = draft_service.run_draft(map_name, excluded_brawlers, initial_team, initial_opponent)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(result)

@app.route('/get_top15_brawlers', methods=['POST'])
def get_top15_brawlers():
    map_name = request.form.get('map')
    top15_brawlers = draft_service.get_top15_brawler_by_map(map_name)

    brawlerImgUrl = []
    for brawler in top15_brawlers:
        for brawlerRaw in dataIndex['brawlers']:
            if brawler[0] == brawlerRaw['name'].upper():
                brawlerImgUrl.append(brawlerRaw['imageUrl'])

    reponse = list(zip(top15_brawlers, brawlerImgUrl))

    return jsonify(reponse)

if __name__ == '__main__':
    app.run(debug=True)

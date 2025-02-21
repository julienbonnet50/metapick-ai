import json
from flask import Flask, jsonify, request, render_template
import pandas as pd

import src.service.DraftService as DraftService

app = Flask(__name__)

# Initialize the DraftService
draft_service = DraftService.DraftService()

# Load data from JSON file
with open('./data/brawlers_maps.json', 'r') as file:
    dataIndex = json.load(file)

@app.route('/')
def index():
    return render_template('index.html', maps=dataIndex['maps'], brawlers=dataIndex['brawlers'])

@app.route('/simulate_draft', methods=['POST'])
def simulate_draft():
    # Extract parameters from the request body
    data = request.form
    map_name = data.get('map', '')
    excluded_brawlers = [b.strip() for b in data.get('excluded_brawlers', "").split(',')]
    initial_team = [b.strip() for b in data.get('initial_team', "").split(',')]
    initial_opponent = [b.strip() for b in data.get('initial_opponent', "").split(',')]

    # Run the draft simulation using the DraftService
    try:
        result = draft_service.run_draft(map_name, excluded_brawlers, initial_team, initial_opponent)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)

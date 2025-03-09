import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
import time
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask import Flask, request, jsonify
from src.config.AppConfig import AppConfig
from src.service import NeuralNetworkService
from src.utils import battlesUtils
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
appConfig = AppConfig()


app = Flask(__name__)

CORS(app, supports_credentials=True, origins=appConfig.origins)

# Construct the correct paths using BASE_DIR
app.secret_key = appConfig.SECRET_KEY
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


# ===========================
# GOOGLE AUTHENTICATION
# ===========================

# @app.route("/auth/login")
# def login():
#     """Redirect to Google OAuth login"""
#     google_auth_url = (
#         "https://accounts.google.com/o/oauth2/auth?"
#         "response_type=code"
#         f"&client_id={appConfig.GOOGLE_CLIENT_ID}"
#         f"&redirect_uri={appConfig.REDIRECT_URI}"
#         "&scope=email%20profile"
#     )
#     return redirect(google_auth_url)


# @app.route("/auth/google")  # ✅ This must match your Google Console URI exactly
# def google_callback():
#     """Handle Google OAuth callback and exchange code for token"""
#     code = request.args.get("code")
#     if not code:
#         return jsonify({"error": "Authorization code not provided"}), 400

#     # Exchange code for tokens
#     token_url = "https://oauth2.googleapis.com/token"
#     token_data = {
#         "code": code,
#         "client_id": appConfig.GOOGLE_CLIENT_ID,
#         "client_secret": appConfig.GOOGLE_CLIENT_SECRET,
#         "redirect_uri": appConfig.REDIRECT_URI,  # Must match Google Console
#         "grant_type": "authorization_code",
#     }
#     token_res = requests.post(token_url, data=token_data)

#     if token_res.status_code != 200:
#         return jsonify({"error": "Failed to retrieve token", "details": token_res.text}), 400

#     token_json = token_res.json()

#     # Verify the token and get user info
#     try:
#         id_info = id_token.verify_oauth2_token(
#             token_json.get("id_token"), google_requests.Request(), appConfig.GOOGLE_CLIENT_ID
#         )
#     except ValueError:
#         return jsonify({"error": "Invalid token"}), 400

#     session["user"] = id_info  # Save user session

#     return redirect(url_for("/"))



# @app.route("/auth/logout")
# def logout():
#     """Clear session on logout"""
#     session.clear()
#     return jsonify({"message": "Logged out successfully"})


# @app.route("/auth/user")
# def get_user():
#     """Return user info if logged in"""
#     user = session.get("user")
#     if not user:
#         return jsonify({"error": "User not logged in"}), 401
#     return jsonify(user)

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
    
@app.route('/get_game_versions', methods=['GET'])
def get_game_versions(): 
    return appConfig.data_game_version

@app.route('/simulate_draft', methods=['POST'])
def simulate_draft():
    try: 
        startTime = int(round(time.time() * 1000))
        # Extract parameters from the request body
        data = request.get_json()
        mapName = data.get('map', '')
        
        # Use getlist() to retrieve all values for multi-select fields
        available_brawlers = [b.strip().upper() for b in data.get('available_brawlers', [])]
        excluded_brawlers = [b.strip().upper() for b in data.get('excluded_brawlers', [])]
        friend_brawlers = [b.strip().upper() for b in data.get('initial_team')]
        enemy_brawlers = [b.strip().upper() for b in data.get('initial_opponent')]

        # Get predictions
        top10_brawlers = neuralNetworkService.predict_best_brawler(friend_brawlers, enemy_brawlers, mapName, excluded_brawlers, available_brawlers=available_brawlers)

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
            print(f"Available Brawlers : {available_brawlers}")
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
    
@app.route('/predict_winrate', methods=['POST'])
def predict_winrate():
    try: 
        startTime = int(round(time.time() * 1000))
        # Extract parameters from the request body
        data = request.get_json()
        mapName = data.get('map', '')
        
        # Use getlist() to retrieve all values for multi-select fields
        friend_brawlers = [b.strip().upper() for b in data.get('initial_team')]
        enemy_brawlers = [b.strip().upper() for b in data.get('initial_opponent')]

        predicted_winrate = neuralNetworkService.predict_winrate(friend_brawlers, enemy_brawlers, mapName)

                # Display results
        if appConfig.logs_level > 0:
            print("============ /simulate_draft response ============")
            print(f"Map : {mapName}")
            print(f"Friend Brawlers : {friend_brawlers}")
            print(f"Enemy Brawlers : {enemy_brawlers}")
            print(f"Estimated Winrate: {predicted_winrate}")
            print("in ", int(round(time.time() * 1000)) - startTime, "ms")

        return str(predicted_winrate)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/tier_list', methods=['POST'])
def get_tier_list():
    try: 
        data = request.get_json()
        mapName = data.get('map', '')
        
        for item in appConfig.dataTierList:
            if item['mapName'] == mapName:
                return  jsonify(item['tierList'])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/stats', methods=['POST'])
def get_stats_per_map():
    try: 
        data = request.get_json()
        mapName = data.get('map', '')
        
        filteredDf = appConfig.battleStats[appConfig.battleStats["map"] == mapName] if mapName else appConfig.battleStats
        return filteredDf.to_dict(orient="records")
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/account', methods=['POST'])
def get_accountBrawlers():
    try: 
        data = request.get_json()
        player_tag = data.get('player_tag', '')
        dataBrawlerAccount = battlesUtils.get_account_brawlers(player_tag=player_tag, API_KEY=appConfig.API_KEY, BASE_URL=appConfig.BASE_URL)
        
        return battlesUtils.get_brawlers_with_high_power(dataBrawlerAccount)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=appConfig.port)
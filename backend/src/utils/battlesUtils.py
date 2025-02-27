from datetime import datetime
import json
import math
from typing import *
import uuid
import requests


def get_battle_log(player_tag, API_KEY, BASE_URL, writeEnabled=False):
    player_tag = player_tag.replace("#", "%23")  # Encode '#' as '%23'
    url = f"{BASE_URL}/players/{player_tag}/battlelog"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }

    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        if writeEnabled:
            with open(f"data/battles/unique_battle_{player_tag}.json", "w") as json_file:
                json.dump(response.json(), json_file, indent=4)

        return response.json()
    else:
        return {"error": response.status_code, "message": response.text}

def get_all_battles_from_tag(player_tag, postgreService, brawlers, API_KEY, BASE_URL, writeEnabled=False):
    data = get_battle_log(player_tag=player_tag,
                          API_KEY=API_KEY,
                          BASE_URL=BASE_URL,
                          writeEnabled=writeEnabled)
    try:
        for rawBattle in data['items']:
            transform_battle(postgreService,
                                        brawlers, 
                                        rawBattle)
    except Exception as e:
        print(e)

def extract_players_from_battle(postgreService, brawlers, b: Dict[str, Any]) -> Dict[str, Any]:
    # Get the current date
    current_date = datetime.now().date().strftime('%Y-%m-%d')

    # Ignore any battles that are not ranked
    if b["battle"]["type"] not in ["soloRanked", "teamRanked"]:
        # print(f"Battle id ${b["event"]["id"]} is not a ranked game")
        return
    
    if "teams" in b["battle"]:
        for team in b["battle"]["teams"]:
            for player in team:
                if player["brawler"]["trophies"] == -1:
                    player["brawler"]["trophies"] = None
                if player["brawler"]["power"] == -1:
                    player["brawler"]["power"] = 0
                player["brawler"]["name"] = player["brawler"].get("name") or brawlers.get(player["brawler"]["id"].upper())
                player_brawler = player["brawler"]["name"].replace("\n", " ")
                tag = player["tag"]
                last_rank = player["brawler"]["trophies"]
                if last_rank > 19:
                    last_rank = math.floor(last_rank / 500 + 1)

                max_rank = None
                insert_date = current_date
                last_update_date = current_date
                postgreService.insert_player(tag, last_rank, max_rank, insert_date, last_update_date)


def transform_battle(postgreService, brawlers, b: Dict[str, Any], insertNewPlayers=True) -> Dict[str, Any]:
    # Ignore any battles that are not ranked
    if b["battle"]["type"] not in ["soloRanked", "teamRanked"]:
        # print(f"Battle id ${b["event"]["id"]} is not a ranked game")
        return
    
    current_date = datetime.now().date().strftime('%Y-%m-%d')
    rank = None
    avg_rank = 0
    wTeam = None
    lTeam = None

    if "rank" in b["battle"]:
        if b["battle"]["rank"] != -1:
            rank = format_league_ranks(b["battle"]["rank"])
    
    if b["event"]["id"] == 0 and b["event"].get("map") is None:
        b["event"]["map"] = "Competition Entry"
    
    b["event"]["id"] = b["event"].get("id", 0)
    b["event"]["map"] = b["event"].get("map", "")
    b["event"]["mode"] = b["event"].get("mode", b["battle"].get("mode", ""))
    
    if b["event"]["mode"] in ["roboRumble", "bigGame"] and b["battle"].get("result") is None:
        b["battle"]["result"] = "victory" if b["battle"].get("duration") is None else "defeat"
        b["battle"].pop("duration", None)
    
    if "duration" in b["battle"]:
        minutes = b["battle"]["duration"] // 60
        seconds = b["battle"]["duration"] % 60
        result = f"{minutes}m {seconds}s"
    
    
    if "rank" in b["battle"]:
        result = f"Rank {b["battle"]["rank"]}"
        if "players" in b["battle"]:
            victory = b["battle"]["rank"] <= len(b["battle"]["players"]) / 2
        if "teams" in b["battle"]:
            victory = b["battle"]["rank"] <= len(b["battle"]["teams"]) / 2

    if "result" in b["battle"]:
        result = b["battle"]["result"].capitalize()
        victory = b["battle"]["result"] == "victory"

    if "teams" in b["battle"]:
        for team in b["battle"]["teams"]:            
            for player in team:
                if player["brawler"]["trophies"] == -1:
                    player["brawler"]["trophies"] = None
                if player["brawler"]["power"] == -1:
                    player["brawler"]["power"] = 0

                player["brawler"]["name"] = player["brawler"].get("name") or brawlers.get(player["brawler"]["id"].upper())
                player["brawler"]["name"] = player["brawler"]["name"].replace("\n", " ")
                avg_rank += player["brawler"]["trophies"]

                if insertNewPlayers:
                    tag = player["tag"]
                    last_rank = player["brawler"]["trophies"]
                    if last_rank > 19:
                        last_rank = math.floor(last_rank / 500 + 1)

                    max_rank = None
                    insert_date = current_date
                    last_update_date = current_date
                    postgreService.insert_player(tag, last_rank, max_rank, insert_date, last_update_date)


    avg_rank = round(math.floor(avg_rank / 6), 1)

    brawler1Winner = check_brawler_name(b["battle"]["teams"][0][0]["brawler"]["name"])
    brawler2Winner = check_brawler_name(b["battle"]["teams"][0][1]["brawler"]["name"])
    brawler3Winner = check_brawler_name(b["battle"]["teams"][0][2]["brawler"]["name"])
    brawler1Loser = check_brawler_name(b["battle"]["teams"][1][0]["brawler"]["name"])
    brawler2Loser = check_brawler_name(b["battle"]["teams"][1][1]["brawler"]["name"])
    brawler3Loser = check_brawler_name(b["battle"]["teams"][1][2]["brawler"]["name"])

    wTeam = f"{brawler1Winner}-{brawler2Winner}-{brawler3Winner}"
    lTeam = f"{brawler1Loser}-{brawler2Loser}-{brawler3Loser}"
    
    # teams = b["battle"].get("teams", [[p] for p in b["battle"].get("players", [])])
    # if "bigBrawler" in b["battle"]:
    #     teams.append([b["battle"]["bigBrawler"]])

    id = b["battleTime"] + "-" + str(b["event"]["id"]) + "-" + str(avg_rank) + "-" + str(b["battle"]["duration"]),
    timestamp = b["battleTime"],
    map = b["event"]["map"],
    mode = b["event"]["mode"],
    avg_rank = avg_rank,
    wTeam = wTeam,
    lTeam = lTeam,

    #  def insert_battle_stats(self, id, timestamp, map, mode, avg_rank, wTeam, lTeam, result):
    postgreService.insert_battle_stats(id, timestamp, map, mode, avg_rank, wTeam, lTeam, current_date)

def check_brawler_name(name):
    if name in ["R-T", "8-BIT",]:
        return name.replace("-", "") 
    else:
        return name

def read_json(filename="battlelog.json"):
    try:
        with open(filename, "r") as json_file:
            data = json.load(json_file)
        return data
    except FileNotFoundError:
        return {"error": "File not found"}
    except json.JSONDecodeError:
        return {"error": "Error decoding JSON"}

def format_league_ranks(rank: int):
    # Min rank: 1, Max rank: 19
    leagues = ["Bronze", "Silver", "Gold", "Diamond", "Mythic", "Legendary", "Masters"]
    league_subs = ["I", "II", "III"]

    league = leagues[(rank - 1) // 3]
    league_sub = league_subs[(rank - 1) % 3] if rank < 19 else ""

    return f"{league} {league_sub}".strip()

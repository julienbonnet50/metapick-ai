import src.utils.battlesUtils as battlesUtils


brawlerData = battlesUtils.read_json("data/brawlers.json")
brawler_map = {brawler['name'].upper(): brawler for brawler in brawlerData['brawlers']}

import json

# Function to read JSON file
def read_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# Function to write JSON file
def write_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

# Read the existing JSON file with maps
maps_data = read_json("data/maps.json")
brawlers = []
# Modify brawler names
for brawler in list(brawler_map.keys()):
    if brawler == "8-BIT":
        brawler_map["8BIT"] = brawler_map.pop(brawler)
    elif brawler == "R-T":
        brawler_map["RT"] = brawler_map.pop(brawler)
    brawlers.append(brawler)

# Add the modified brawler data to the existing JSON structure
maps_data['brawlers'] = brawlers

# Write the updated JSON structure back to a file
write_json("data/updated_maps.json", maps_data)

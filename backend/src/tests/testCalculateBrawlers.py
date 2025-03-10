import json
import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.src.utils.accountUtils import BrawlerUpgrade

data = json.load(open("backend/data/test.json"))
test_brawlers = data["brawlers"]

for brawler in test_brawlers:
    brawler_upgrade = BrawlerUpgrade(
        name=brawler["name"],   
        current_power=brawler["power"],
        gears=brawler["gears"], 
        star_powers=brawler["starPowers"],
        gadgets=brawler["gadgets"]
    )
    brawler_upgrade.print_upgrade_cost()


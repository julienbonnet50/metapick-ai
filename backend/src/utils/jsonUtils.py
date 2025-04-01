import json


def read_json(filename="battlelog.json"):
    try:
        with open(filename, "r") as json_file:
            data = json.load(json_file)
        return data
    except FileNotFoundError:
        return {"error": "File not found"}
    except json.JSONDecodeError:
        return {"error": "Error decoding JSON"}

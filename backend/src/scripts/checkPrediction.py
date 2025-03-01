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

from backend.src.config.AppConfig import AppConfig
from backend.src.service import NeuralNetworkService

appConfig = AppConfig()
version = "35_1"
neuralNetworkService = NeuralNetworkService.NeuralNetworkService(data_path=f"./backend/src/data/model/version_{version}/mappings.pkl", 
                                                                 model_path=f"./backend/src/data/model/version_{version}/nn_model_all.pth", 
                                                                 version=version,
                                                                 appConfig=appConfig)



mapName = 'Center Stage'
excluded_brawlers = ['DYNAMIKE', 'MORTIS']
friend_brawlers = ['SPIKE']
enemy_brawlers = ['AMBER']

print(neuralNetworkService.predict_best_brawler(friends=friend_brawlers, enemies=enemy_brawlers, map_name=mapName, excluded=excluded_brawlers))
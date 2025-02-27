import numpy as np
import psycopg2
import pandas as pd
import sys
import os

# Necessary import for your app configuration
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

import src.config.AppConfig as AppConfig

appConfig = AppConfig.AppConfig()

# Step 1: Connect to the Database
conn = psycopg2.connect(
    dbname='bs-project',
    user="postgres",
    password=appConfig.POSTGRE_SQL_PASSWORD,
    host="localhost",
    port="5432"
)

# Step 2: Fetch the Data
query = """
SELECT * 
FROM (
	WITH winners AS (
	    SELECT 
	        map,
	        unnest(string_to_array(replace(wTeam, ' & ', '-'), '-')) AS brawler
	    FROM battles
	),
	losers AS (
	    SELECT 
	        map,
	        unnest(string_to_array(replace(lTeam, ' & ', '-'), '-')) AS brawler
	    FROM battles
	),
	brawler_stats AS (
	    -- Winning brawlers get win flag 1; losing brawlers get 0
	    SELECT map, brawler, 1 AS win
	    FROM winners
	    UNION ALL
	    SELECT map, brawler, 0 AS win
	    FROM losers
	),
	map_games AS (
	    -- Total games per map
	    SELECT map, COUNT(*) AS total_games
	    FROM battles
	    GROUP BY map
	)
	SELECT 
	    bs.map,
	    bs.brawler,
	    COUNT(*) AS games,
	    SUM(bs.win) AS total_wins,
	    COUNT(*) - SUM(bs.win) AS total_losses,
	    ROUND(SUM(bs.win)::numeric / COUNT(*) * 100, 2) AS win_rate,  -- win rate percentage
	    ROUND(COUNT(*)::numeric / mg.total_games * 100, 2) AS use_rate   -- use rate percentage
	FROM brawler_stats bs
	JOIN map_games mg ON bs.map = mg.map
	GROUP BY bs.map, bs.brawler, mg.total_games
)
WHERE games > 150
ORDER BY win_rate DESC;
"""
df = pd.read_sql_query(query, conn)

print("df Retrieved")

df = df.where(df['brawler'] != 'None')



# Step 3: Bayesian Mean (Empirical Bayes)
# The formula is: (wins + 1) / (total_matches + 2) * 100
global_win_rate = df['total_wins'].sum() / df['games'].sum()
k = 10  # A tuning parameter (higher = stronger prior influence)
df['adj_win_rate'] = ((df['total_wins'] + k * global_win_rate) / 
                      (df['games'] + k)) * 100



# (Optional) You can still compute normalized win_rate/usage_rate if needed,
# but for TOPSIS we will work directly on the adjusted metrics.

# --------------------------
# TOPSIS Implementation
# --------------------------
# We will use two criteria:
# 1. Adjusted win rate (the higher the better)
# 2. Usage rate (the higher the better; indicates reliability)

# Define the weights for each criterion:
win_rate_weight = 0.7
usage_rate_weight = 0.3

# Build the decision matrix using the two criteria:
# Note: Make sure to use the adjusted win rate!
decision_matrix = df[['adj_win_rate', 'use_rate']].to_numpy()

# Normalize the decision matrix using Euclidean norm (vector normalization)
norm_matrix = decision_matrix / np.sqrt((decision_matrix ** 2).sum(axis=0))

# Multiply the normalized values by the defined weights
weighted_matrix = norm_matrix * np.array([win_rate_weight, usage_rate_weight])

# Determine the ideal best and ideal worst values per criterion:
# For beneficial criteria, the ideal best is the maximum and the ideal worst is the minimum.
ideal_best = np.max(weighted_matrix, axis=0)
ideal_worst = np.min(weighted_matrix, axis=0)

# Calculate the Euclidean distance of each alternative to the ideal best and worst
distance_best = np.sqrt(((weighted_matrix - ideal_best) ** 2).sum(axis=1))
distance_worst = np.sqrt(((weighted_matrix - ideal_worst) ** 2).sum(axis=1))

# Compute the TOPSIS closeness coefficient (score):
# A higher score (closer to 1) indicates a candidate that is nearer to the ideal solution.
df['topsis_score'] = distance_worst / (distance_best + distance_worst)

# Sort the DataFrame by the TOPSIS score in descending order
df_sorted = df.sort_values(by='topsis_score', ascending=False)

# Print the ranked brawlers for each map along with key metrics
print(df_sorted[['map', 'brawler', 'topsis_score', 'adj_win_rate', 'use_rate']])

# Optionally, save the sorted DataFrame
df_sorted.to_pickle('./data/model/metrics-above-mythic.pkl')

df_sorted.to_csv('./data/model/metrics-above-mythic.csv', index=False)

# Close the database connection
conn.close()

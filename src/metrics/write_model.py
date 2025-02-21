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
	SELECT
	    brawler,
	    map,
	    wins,
	    losses,
	    (wins + losses) AS total_matches,
	    (wins::FLOAT / (wins + losses)) * 100 AS win_rate,
	    (wins + losses)::FLOAT / (SELECT COUNT(*) * 6 FROM battles) * 100 AS usage_rate
	FROM (
	    SELECT
	        brawler,
	        map,
	        SUM(CASE WHEN result = 'Victory' THEN 1 ELSE 0 END) AS wins,
	        SUM(CASE WHEN result = 'Defeat' THEN 1 ELSE 0 END) AS losses
	    FROM (
	        SELECT
	            id,
	            timestamp,
	            map,
	            mode,
	            avg_rank,
	            unnest(string_to_array(wTeam, '-')) AS brawler,
	            result
	        FROM battles
	        WHERE avg_rank > 12
	        UNION ALL
	        SELECT
	            id,
	            timestamp,
	            map,
	            mode,
	            avg_rank,
	            unnest(string_to_array(lTeam, '-')) AS brawler,
	            result
	        FROM battles
	        WHERE avg_rank > 12
	    ) AS brawlers
	    GROUP BY brawler, map
	) AS brawler_stats
	ORDER BY win_rate DESC
)
WHERE total_matches > 150
"""

df = pd.read_sql_query(query, conn)

# Step 3: Compute the Bayesian Adjusted Win Rate using a Beta(1,1) prior
# The formula is: (wins + 1) / (total_matches + 2) * 100
df['adj_win_rate'] = (df['wins'] + 1) / (df['total_matches'] + 2) * 100

# (Optional) You can still compute normalized win_rate/usage_rate if needed,
# but for TOPSIS we will work directly on the adjusted metrics.

# --------------------------
# TOPSIS Implementation
# --------------------------
# We will use two criteria:
# 1. Adjusted win rate (the higher the better)
# 2. Usage rate (the higher the better; indicates reliability)

# Define the weights for each criterion:
win_rate_weight = 0.5
usage_rate_weight = 0.5

# Build the decision matrix using the two criteria:
# Note: Make sure to use the adjusted win rate!
decision_matrix = df[['adj_win_rate', 'usage_rate']].to_numpy()

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
print(df_sorted[['map', 'brawler', 'topsis_score', 'adj_win_rate', 'usage_rate']])

# Optionally, save the sorted DataFrame
df_sorted.to_pickle('./data/model/rankedstats_permaps_topsis2.pkl')

# Close the database connection
conn.close()

import psycopg2
import pandas as pd
import sys
import os

# Necessary import
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))

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
	        --WHERE avg_rank > 15
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
	        --WHERE avg_rank > 15
	    ) AS brawlers
	    GROUP BY brawler, map
	) AS brawler_stats
	ORDER BY win_rate DESC
)
WHERE total_matches > 150
"""

df = pd.read_sql_query(query, conn)

# Step 3: Calculate the Scores

# Normalize win_rate and usage_rate
df['win_rate_norm'] = (df['win_rate'] - df['win_rate'].min()) / (df['win_rate'].max() - df['win_rate'].min())
df['usage_rate_norm'] = (df['usage_rate'] - df['usage_rate'].min()) / (df['usage_rate'].max() - df['usage_rate'].min())

# Define a minimum usage rate threshold
min_usage_rate = 0.05  # Example threshold, adjust as needed

# Apply the minimum usage rate threshold
df['usage_penalty'] = df['usage_rate_norm'].apply(lambda x: 1 if x >= min_usage_rate else 0)

# Define the weights
win_rate_weight = 0.4
usage_rate_weight = 0.6

# Calculate the score using normalized metrics and usage penalty
df['score'] = (df['win_rate_norm'] * win_rate_weight) + (df['usage_rate_norm'] * usage_rate_weight) * df['usage_penalty']

# Print the ranked brawlers
print(df[['map', 'brawler', 'score', 'win_rate', 'usage_rate']])

df.to_pickle('./data/model/rankedstats_permaps.pkl')


# Close the database connection
conn.close()
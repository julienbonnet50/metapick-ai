import psycopg2
import pandas as pd
# Necessary import
import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))

import src.service.PostgreService as PostgreService
import src.config.AppConfig as AppConfig
import src.utils.battlesUtils as battlesUtils
from concurrent.futures import ThreadPoolExecutor


appConfig = AppConfig.AppConfig()

conn = psycopg2.connect(
    dbname='bs-project',
    user="postgres",
    password=appConfig.POSTGRE_SQL_PASSWORD,
    host="localhost",
    port="5432"
)

# Step 2: Fetch the Data
query = """
SELECT
    brawler,
    wins,
    losses,
    (wins + losses) AS total_matches,
    (wins::FLOAT / (wins + losses)) * 100 AS win_rate,
    (wins + losses)::FLOAT / (SELECT COUNT(*) * 6 FROM battles) * 100 AS usage_rate
FROM (
    SELECT
        brawler,
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
        WHERE avg_rank > 15
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
        WHERE avg_rank > 15
    ) AS brawlers
    GROUP BY brawler
) AS brawler_stats
ORDER BY win_rate DESC;
"""

df = pd.read_sql_query(query, conn)

# Step 3: Calculate the Scores
# Define the weights
win_rate_weight = 0.5
usage_rate_weight = 0.5

# Calculate the score
df['score'] = (df['win_rate'] * win_rate_weight) + (df['usage_rate'] * usage_rate_weight)

# Step 4: Rank the Brawlers
df = df.sort_values(by='score', ascending=False).reset_index(drop=True)
df['rank'] = df.index + 1

# Print the ranked brawlers
print(df[['rank', 'brawler', 'score', 'win_rate', 'usage_rate']])

# Close the database connection
conn.close()

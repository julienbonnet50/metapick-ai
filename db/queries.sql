-- Create players table
CREATE TABLE IF NOT EXISTS players (
    tag VARCHAR(255) PRIMARY KEY,
    last_rank FLOAT,
    max_rank FLOAT,
    insert_date DATE,
    last_update_date DATE
);


-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP,
    map VARCHAR(255),
    mode VARCHAR(255),
    avg_rank FLOAT,
    wTeam TEXT,
    lTeam TEXT,
    insert_date VARCHAR(255)
);


-- Get winrate, userate for each brawler on each map.
WITH battle_data AS (
    SELECT
        id,
        timestamp,
        map,
        mode,
        avg_rank,
        unnest(string_to_array(wTeam, '-')) AS brawler,
        'Victory' AS result
    FROM battles_s35_3
    WHERE avg_rank > 15
    UNION ALL
    SELECT
        id,
        timestamp,
        map,
        mode,
        avg_rank,
        unnest(string_to_array(lTeam, '-')) AS brawler,
        'Defeat' AS result
    FROM battles_s35_3
    WHERE avg_rank > 15
),
brawler_stats AS (
    SELECT
        brawler,
        map,
        SUM(CASE WHEN result = 'Victory' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN result = 'Defeat' THEN 1 ELSE 0 END) AS losses
    FROM battle_data
    GROUP BY brawler, map
)
SELECT
    brawler,
    map,
    wins,
    losses,
    (wins + losses) AS total_matches,
    (wins::FLOAT / NULLIF(wins + losses, 0)) * 100 AS win_rate,
    (wins + losses)::FLOAT / (SELECT COUNT(*) * 6 FROM battles_s35_3 WHERE avg_rank > 15) * 100 AS usage_rate
FROM brawler_stats
ORDER BY map, win_rate DESC;




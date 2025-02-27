CREATE TABLE IF NOT EXISTS players (
    tag VARCHAR(255) PRIMARY KEY,
    last_rank FLOAT,
    max_rank FLOAT,
    insert_date DATE,
    last_update_date DATE
);



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


-- First statistics overview
DROP TABLE IF EXISTS brawlers;
DROP TABLE IF EXISTS brawler_stats;

CREATE TEMPORARY TABLE brawlers AS
SELECT
    id,
    timestamp,
    map,
    mode,
    avg_rank,
    unnest(string_to_array(wTeam, '-')) AS brawler,
    result
FROM battles
UNION ALL
SELECT
    id,
    timestamp,
    map,
    mode,
    avg_rank,
    unnest(string_to_array(lTeam, '-')) AS brawler,
    result
FROM battles;


CREATE TEMPORARY TABLE brawler_stats AS
SELECT
    brawler,
    SUM(CASE WHEN result = 'Victory' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN result = 'Defeat' THEN 1 ELSE 0 END) AS losses
FROM brawlers
GROUP BY brawler;


SELECT
    brawler,
    wins,
    losses,
    (wins + losses) AS total_matches,
    (wins::FLOAT / (wins + losses)) * 100 AS win_rate,
    (wins + losses)::FLOAT / (SELECT COUNT(*) * 6 FROM battles) * 100 AS usage_rate
FROM brawler_stats
ORDER BY win_rate DESC;


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
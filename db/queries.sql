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

SELECT 'battles_s35_1' AS table_name, COUNT(*) AS row_count FROM battles_s35_1
UNION ALL
SELECT 'battles_s35_2', COUNT(*) FROM battles_s35_2;


-- RANKS :
--      1 -> Bronze I
--      2 -> Bronze II
--      3 -> Bronze III
--      4 -> Silver I
--      5 -> Silver II
--      6 -> Silver III
--      7 -> Gold I
--      8 -> Gold II
--      9 -> Gold III
--      10 -> Diamond I
--      11 -> Diamond II
--      12 -> Diamond III
--      13 -> Mythic I
--      14 -> Mythic II
--      15 -> Mythic III
--      16 -> Legendary I
--      17 -> Legendary II
--      18 -> Legendary III
--      19 -> Masters I
--      20 -> Masters II
--      21 -> Masters III
--      22 -> Pro
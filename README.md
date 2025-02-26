# bs-ranked-stats
Little exposition to get best pick per maps in ranked

https://julienbonnet50.github.io/bs-ranked-stats/


## Data

### Players :

```sql
CREATE TABLE IF NOT EXISTS players (
    tag VARCHAR(255) PRIMARY KEY,
    last_rank FLOAT,
    max_rank FLOAT,
    insert_date DATE,
    last_update_date DATE
);
```
- tag : supercell id of a player
- last_rank : last rank seen of a player
- max_rank : highest rank of a players (still WIP)
- insert_date : date of insertion in the table
- last_update_date : date of player update (still WIP)

### Battles :

```sql
CREATE TABLE IF NOT EXISTS battles (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP,
    map VARCHAR(255),
    mode VARCHAR(255),
    avg_rank FLOAT,
    wteam TEXT,
    lteam TEXT,
    insert_date VARCHAR(255)
);
```
- id : primary key, uniqueId of the battle
- timestamp : timestamp of the battle
- map : map of the game
- mode : mode of the game
- avg_rank : average rank of all players in the game
- wteam : winning team of the game (example : "RICK-BROCK-TICK" , or "POCO-SURGE-KENJI")
- lteam : winning team of the game (example : "RICK-BROCK-TICK" , or "POCO-SURGE-KENJI")
- insert_date : date of table insertion

### Knowledges

#### Ranks = brawler.trophies :

```txt
1 -> Bronze I
2 -> Bronze II
3 -> Bronze III
4 -> Silver I
5 -> Silver II
6 -> Silver III
7 -> Gold I
8 -> Gold II
9 -> Gold III
10 -> Diamond I
11 -> Diamond II
12 -> Diamond III
13 -> Mythic I
14 -> Mythic II
15 -> Mythic III
16 -> Legendary I
17 -> Legendary II
18 -> Legendary III
19 -> Masters
```
from datetime import datetime
import json
import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.dirname(p=__file__)))
import psycopg2

class PostgreService():
    def __init__(self, appConfig):
        # Load environment variables from the .env file
        self.appConfig = appConfig
        # Database connection parameters
        db_params = {
            'dbname': 'bs-project',
            'user': 'postgres',
            'password': self.appConfig.POSTGRE_SQL_PASSWORD,
            'host': 'localhost',
            'port': '5432',
            'schema': 'dbo'
        }

        self.cursor = None
        self.conn = None

        # Create a connection to the PostgreSQL database
        try:
            self.conn = psycopg2.connect(
                dbname=db_params['dbname'],
                user=db_params['user'],
                password=db_params['password'],
                host=db_params['host'],
                port=db_params['port']
            )
            self.cursor = self.conn.cursor()
            print('Successfully connected to the PostgreSQL database')
        except psycopg2.Error as e:
            print(f"Error connecting to the database: {e}")
            exit(1)

    # Function to insert data into the players table
    def insert_or_update_player(self, tag, last_rank, max_rank, insert_date, last_update_date, show=False):
        insert_query = """
            INSERT INTO dbo.players (tag, last_rank, max_rank, insert_date, last_update_date)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (tag) 
            DO UPDATE 
            SET 
                last_rank = EXCLUDED.last_rank, 
                max_rank = GREATEST(dbo.players.max_rank, EXCLUDED.last_rank),
                last_update_date = EXCLUDED.last_update_date;
        """

        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.conn.autocommit = False  # Ensure changes are committed only when successful
            self.cursor.execute(insert_query, (tag, last_rank, max_rank, insert_date, last_update_date))
            self.conn.commit()
            if show:
                print(f"Successfully inserted or updated player with tag: {tag}")
        except psycopg2.Error as e:
            self.conn.rollback()
            if show:
                print(f"Error inserting/updating data: {e}")

    def insert_battle_stats(self, id, timestamp, map, mode, avg_rank, wTeam, lTeam, insert_date):
        timestamp_str = timestamp[0].rstrip('Z')  # Remove the trailing 'Z'
        date = datetime.strptime(timestamp_str, "%Y%m%dT%H%M%S.%f").date()  # Parse the date part

        # Convert to a 'yyyy-mm-dd' string
        formatted_date = date.strftime("%Y-%m-%d")
        tableName = self.get_correct_battle_version(formatted_date, self.appConfig.data_all_game_version)
        insert_query = f"""
        INSERT INTO {tableName} (id, timestamp, map, mode, avg_rank, wTeam, lTeam, insert_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(insert_query, (
                id, timestamp, map, mode, avg_rank, wTeam, lTeam, insert_date
            ))
            self.conn.commit()
            # print(f"Successfully inserted battle stats : {id} {timestamp} {map} {mode} {avg_rank} {wTeam} {lTeam} {insert_date}")
        except psycopg2.Error as e:
            self.conn.rollback()
            # print(f"Error inserting data: {e}")
    

    def get_all_players(self):
        select_query = "SELECT * FROM dbo.players;"
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(select_query)
            players = self.cursor.fetchall()
            return players
        except psycopg2.Error as e:
            print(f"Error retrieving data: {e}")
            return []
        
    def execute_custom_query(self, query):
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(query)
            print(f"Query {query} executed successfully")
        except psycopg2.Error as e:
            print(f"Error executing query: {e}")
            return []
        
    import psycopg2

    def create_battles_table_version(self, version):
        query = f"""
        CREATE TABLE IF NOT EXISTS battles_s{str(version)} (
            id VARCHAR(255) PRIMARY KEY,
            timestamp TIMESTAMP,
            map VARCHAR(255),
            mode VARCHAR(255),
            avg_rank FLOAT,
            wTeam TEXT,
            lTeam TEXT,
            insert_date VARCHAR(255)
        );"""
        
        try:
            if self.conn is None or self.cursor is None:
                return "Database connection is not established"

            print(f"Starting to create table battles_s{version}")
            self.cursor.execute(query)
            self.conn.commit()  # Ensure changes are saved
            print(f"Table battles_s{version} created successfully")
            return f"Table battles_s{version} created successfully"

        except psycopg2.Error as e:
            print(f"Error creating table: {e}")
            return f"Error: {e}"  # Return the actual error message


    def get_all_players_from_rank(self, rank, mode):
        if mode not in ["below", "above"]:
            raise Exception(f"wrong mode used : {mode}")
        
        if mode == "below":
            placeHolder = "<"
        else:
            placeHolder = ">"

        select_query = f"SELECT * FROM dbo.players WHERE last_rank {placeHolder} {rank} OR max_rank {placeHolder} {rank};"
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(select_query)
            players = self.cursor.fetchall()
            return players
        except psycopg2.Error as e:
            print(f"Error retrieving data: {e}")
            return []


    def closeDbConnection(self):
        # Close the cursor and connection
        self.cursor.close()
        self.conn.close()

    def get_correct_battle_version(self, target_date, data):
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        
        # Create a valid sorted list, skipping invalid dates
        valid_data = []
        for entry in data:
            try:
                entry_date = datetime.strptime(entry["date"], "%Y-%m-%d").date()
                valid_data.append(entry)
            except ValueError:
                print(f"Warning: Skipping invalid date {entry['date']} for version {entry['version']}")
        
        sorted_data = sorted(valid_data, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d").date())

        # If target_date is before the first recorded entry, return the first valid version
        if target_date < datetime.strptime(sorted_data[0]["date"], "%Y-%m-%d").date():
            return "battles_s" + sorted_data[0]["version"]  # Return the first version

        # Iterate through sorted data to find the correct version
        for i in range(1, len(sorted_data)):
            current_entry = sorted_data[i]
            current_date = datetime.strptime(current_entry["date"], "%Y-%m-%d").date()
            previous_entry = sorted_data[i - 1]
            previous_date = datetime.strptime(previous_entry["date"], "%Y-%m-%d").date()

            # If target_date falls between two versions, return the previous version
            if previous_date <= target_date < current_date:
                return "battles_s" + previous_entry["version"]

        # If target_date is after all entries, return the last known version
        return "battles_s" + sorted_data[-1]["version"]
    
    def get_battle_count(self, version):
        """Query PostgreSQL to get battle count for a specific version."""
        query = f"SELECT COUNT(*) FROM battles_s{version};"
        
        try:
            if self.conn is None or self.cursor is None:
                return "Database connection is not established"

            print(f"Starting to create table battles_s{version}")            
            cur = self.conn.cursor()
            cur.execute(query)
            count = cur.fetchone()[0]
            cur.close()
            return count
        except Exception as e:
            print(f"Database error: {e}")
            return None
    
    def update_game_version(self, version, game_version_path):
        """Update the JSON file with the latest battle count for the given version."""
        count = self.get_battle_count(version)
        if count is None:
            print(f"Could not update count for version {version}")
            return
        
        # Load the current data
        try:
            with open(game_version_path, "r") as file:
                data = json.load(file)
        except FileNotFoundError:
            print(f"File not found: {game_version_path}")
            return
        
        # Find the matching version and update count
        updated = False
        for entry in data:
            if entry["version"] == version:
                entry["count"] = count
                updated = True
                break

        if updated:
            with open(game_version_path, "w") as file:
                json.dump(data, file, indent=4)
            print(f"Updated version {version} count to {count}")
        else:
            print(f"Version {version} not found in data file.")


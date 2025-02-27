from datetime import datetime
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
    def insert_player(self, tag, last_rank, max_rank, insert_date, last_update_date, show=False):
        insert_query = """
        INSERT INTO dbo.players (tag, last_rank, max_rank, insert_date, last_update_date)
        VALUES (%s, %s, %s, %s, %s);
        """
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(insert_query, (tag, last_rank, max_rank, insert_date, last_update_date))
            self.conn.commit()
            if show:
                print(f"Successfully inserted player with tag: {tag}")
        except psycopg2.Error as e:
            self.conn.rollback()
            # print(f"Error inserting data: {e}")


    def insert_battle_stats(self, id, timestamp, map, mode, avg_rank, wTeam, lTeam, insert_date):
        timestamp_str = timestamp[0].rstrip('Z')  # Remove the trailing 'Z'
        date = datetime.strptime(timestamp_str, "%Y%m%dT%H%M%S.%f").date()  # Parse the date part

        # Convert to a 'yyyy-mm-dd' string
        formatted_date = date.strftime("%Y-%m-%d")
        tableName = self.get_correct_battle_version(formatted_date, self.appConfig.version)
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
        

    def get_all_battles(self):
        select_query = "SELECT * FROM battles;"
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(select_query)
            players = self.cursor.fetchall()
            column_names = [desc[0] for desc in self.cursor.description]
            return players, column_names
        except psycopg2.Error as e:
            print(f"Error retrieving data: {e}")
            return [], []
    
    def get_all_players_from_rank(self, rank, mode):
        if mode not in ["below", "above"]:
            raise Exception(f"wrong mode used : {mode}")
        
        if mode == "below":
            placeHolder = "<"
        else:
            placeHolder = ">"

        select_query = f"SELECT * FROM dbo.players WHERE last_rank {placeHolder} {rank};"
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

        # Sort data by date (ascending)
        sorted_data = sorted(data, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d").date())

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
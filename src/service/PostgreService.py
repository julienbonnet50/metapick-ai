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


    def insert_battle_stats(self, id, timestamp, map, mode, avg_rank, wTeam, lTeam, result):
        insert_query = """
        INSERT INTO battles (id, timestamp, map, mode, avg_rank, wTeam, lTeam, result)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """
        try:
            if self.cursor is None or self.conn is None:
                return "Database connection is not established"

            self.cursor.execute(insert_query, (
                id, timestamp, map, mode, avg_rank, wTeam, lTeam, result
            ))
            self.conn.commit()
            # print(f"Successfully inserted battle stats with id: {id}")
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

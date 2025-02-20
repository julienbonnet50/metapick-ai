from dotenv import load_dotenv
import os
import psycopg2

# Load environment variables from the .env file
load_dotenv()

# Retrieve the password from the environment variables
password = os.getenv("POSTGRE_SQL_PASSWORD")

query = """
CREATE TABLE dbo.players (
    tag VARCHAR(255) PRIMARY KEY,
    last_rank FLOAT,
    max_rank FLOAT,
    insert_date DATE,
    last_update_date DATE
);
"""

# Database connection parameters
db_params = {
    'dbname': 'bs-project',
    'user': 'postgres',
    'password': password,
    'host': 'localhost',
    'port': '5432',
    'schema': 'dbo'
}

def execute_sql_file(query, db_params):
    cursor = None
    conn = None

    # Create a connection to the PostgreSQL database
    try:
        conn = psycopg2.connect(
            dbname=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            host=db_params['host'],
            port=db_params['port']
        )
        cursor = conn.cursor()
        print('Successfully connected to the PostgreSQL database')


        # Execute the SQL queries
        cursor.execute(query)

        # Commit the changes
        conn.commit()
        print("SQL queries executed successfully.")

    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
        exit(1)

    finally:
        # Close the cursor and connection
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Execute the SQL file
execute_sql_file(query, db_params)

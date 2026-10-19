import oracledb
from dotenv import load_dotenv
import os

def create_connection():
    load_dotenv()  # Load environment variables from .env file

    # Get database credentials from environment variables
    hostname = os.getenv("DB_HOSTNAME")
    port = os.getenv("DB_PORT")
    service_name = os.getenv("DB_SERVICE")
    username = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")

    try:
        dsn = oracledb.makedsn(hostname, port, service_name=service_name)
        connection = oracledb.connect(user=username, password=password, dsn=dsn)
        print("Connection successful!")
        return connection
    except oracledb.DatabaseError as e:
        #print(f"Connection failed!: {e}")
        error, = e.args
        print(f"Oracle-Error-Code: {error.code}")
        print(f"Oracle-Error-Message: {error.message}")
        return None

def close_connection(connection):
    if connection:
        connection.close()
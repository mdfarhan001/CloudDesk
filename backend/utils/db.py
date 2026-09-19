import pymysql
from config import Config


def get_db_connection():
    """
    Creates a new connection to MySQL for each request.
    Uses DictCursor so rows come back as Python dicts (easy to convert to JSON).
    """
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )

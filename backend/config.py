import os
from datetime import timedelta


class Config:
    # MySQL connection settings (Flask -> MySQL, never Frontend -> MySQL)
    MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "clouddesk_user")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "change_this_password")
    MYSQL_DB = os.getenv("MYSQL_DATABASE", "clouddesk_db")

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

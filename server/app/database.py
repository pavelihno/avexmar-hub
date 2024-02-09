from flask_sqlalchemy import SQLAlchemy

def __create_database():
   return SQLAlchemy()

db = __create_database()
import os
import importlib
from config import Config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

def __import_models():
   app_dir = 'app'
   models_dir = 'models'
   for dir_path, dir_names, file_names in os.walk('/'.join([app_dir, models_dir])):
      for file_name in [f for f in file_names if f.endswith('.py') and f != '__init__.py']:
         file_path_wo_ext, _ = os.path.splitext(os.path.join(dir_path, file_name))
         module_name = file_path_wo_ext.replace(os.sep, '.').replace(f"{app_dir}.", '')
         importlib.import_module(module_name, package=None)

   return True

def __create_database():
   return SQLAlchemy()

def __create_app(_config_class, _db):
   app = Flask(__name__)
   app.config.from_object(_config_class)

   __import_models()

   _db.init_app(app)

   return app


db = __create_database()
app = __create_app(Config, db)
migrate = Migrate(app, db)


@app.route("/")
def index():
   return "Hello World"
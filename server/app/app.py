import os
import importlib
from flask import Flask
from flask_migrate import Migrate

from config import Config
from database import db

from controllers.auth_controller import *
from controllers.user_controller import *

def __import_models():
   app_dir = 'app'
   models_dir = 'models'
   for dir_path, dir_names, file_names in os.walk('/'.join([app_dir, models_dir])):
      for file_name in [f for f in file_names if f.endswith('.py') and f != '__init__.py']:
         file_path_wo_ext, _ = os.path.splitext(os.path.join(dir_path, file_name))
         module_name = file_path_wo_ext.replace(os.sep, '.').replace(f"{app_dir}.", '')
         importlib.import_module(module_name, package=None)

   return True

def __create_app(_config_class, _db):
   app = Flask(__name__)
   app.config.from_object(_config_class)

   # Required for tracking migrations
   __import_models()

   _db.init_app(app)

   return app

app = __create_app(Config, db)
migrate = Migrate(app, db)

# auth
app.route('/register', methods=['POST'])(register)
app.route('/login', methods=['POST'])(login)
app.route('/auth', methods=['GET'])(auth)

# users
app.route('/users', methods=['GET'])(get_users)
app.route('/users', methods=['POST'])(create_user)
app.route('/users/<int:user_id>', methods=['GET'])(get_user)
app.route('/users/<int:user_id>', methods=['PUT'])(update_user)
app.route('/users/<int:user_id>', methods=['DELETE'])(delete_user)
app.route('/users/<int:user_id>/activate', methods=['PUT'])(activate_user)
app.route('/users/<int:user_id>/deactivate', methods=['PUT'])(deactivate_user)
app.route('/users/change-password', methods=['PUT'])(change_password)
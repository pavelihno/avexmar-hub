import os
import importlib
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

from app.config import Config
from app.database import db

from app.controllers.auth_controller import *
from app.controllers.user_controller import *
from app.controllers.airport_controller import *
from app.controllers.route_controller import *
from app.controllers.flight_controller import *
from app.controllers.tariff_controller import *
from app.controllers.discount_controller import *
from app.controllers.seat_controller import *
from app.controllers.passenger_controller import *
from app.controllers.booking_controller import *
from app.controllers.payment_controller import *


def __import_models():
    models_dir = 'app/models'
    for dir_path, dir_names, file_names in os.walk(models_dir):
        for file_name in [f for f in file_names if f.endswith('.py') and f != '__init__.py']:
            file_path_wo_ext, _ = os.path.splitext(os.path.join(dir_path, file_name))
            module_name = file_path_wo_ext.replace(os.sep, '.').replace(f"{models_dir}.", '')
            importlib.import_module(module_name, package=None)

    return True


def __create_app(_config_class, _db):
    app = Flask(__name__)
    app.config.from_object(_config_class)

    # Enable CORS for all routes
    CORS(app, resources={r"/*": {"origins": Config.CORS_ORIGINS}})

    # Required for tracking migrations
    __import_models()

    _db.init_app(app)

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
    app.route('/users/change_password', methods=['PUT'])(change_password)

    # airports
    app.route('/airports', methods=['GET'])(get_airports)
    app.route('/airports', methods=['POST'])(create_airport)
    app.route('/airports/<int:airport_id>', methods=['PUT'])(update_airport)
    app.route('/airports/<int:airport_id>', methods=['DELETE'])(delete_airport)

    # routes
    app.route('/routes', methods=['GET'])(get_routes)
    app.route('/routes', methods=['POST'])(create_route)
    app.route('/routes/<int:route_id>', methods=['PUT'])(update_route)
    app.route('/routes/<int:route_id>', methods=['DELETE'])(delete_route)

    # flights
    app.route('/flights', methods=['GET'])(get_flights)
    app.route('/flights', methods=['POST'])(create_flight)
    app.route('/flights/<int:flight_id>', methods=['PUT'])(update_flight)
    app.route('/flights/<int:flight_id>', methods=['DELETE'])(delete_flight)

    # tariffs
    app.route('/tariffs', methods=['GET'])(get_tariffs)
    app.route('/tariffs', methods=['POST'])(create_tariff)
    app.route('/tariffs/<int:tariff_id>', methods=['PUT'])(update_tariff)
    app.route('/tariffs/<int:tariff_id>', methods=['DELETE'])(delete_tariff)

    # discounts
    app.route('/discounts', methods=['GET'])(get_discounts)
    app.route('/discounts', methods=['POST'])(create_discount)
    app.route('/discounts/<int:discount_id>', methods=['PUT'])(update_discount)
    app.route('/discounts/<int:discount_id>', methods=['DELETE'])(delete_discount)

    # seats
    app.route('/seats', methods=['GET'])(get_seats)
    app.route('/seats', methods=['POST'])(create_seat)
    app.route('/seats/<int:seat_id>', methods=['PUT'])(update_seat)
    app.route('/seats/<int:seat_id>', methods=['DELETE'])(delete_seat)

    # passengers
    app.route('/passengers', methods=['GET'])(get_passengers)
    app.route('/passengers', methods=['POST'])(create_passenger)
    app.route('/passengers/<int:passenger_id>', methods=['GET'])(get_passenger)
    app.route('/passengers/<int:passenger_id>', methods=['PUT'])(update_passenger)
    app.route('/passengers/<int:passenger_id>', methods=['DELETE'])(delete_passenger)

    # bookings
    app.route('/bookings', methods=['GET'])(get_bookings)
    app.route('/bookings', methods=['POST'])(create_booking)
    app.route('/bookings/<int:booking_id>', methods=['PUT'])(update_booking)
    app.route('/bookings/<int:booking_id>', methods=['DELETE'])(delete_booking)

    # payments
    app.route('/payments', methods=['GET'])(get_payments)
    app.route('/payments', methods=['POST'])(create_payment)
    app.route('/payments/<int:payment_id>', methods=['PUT'])(update_payment)
    app.route('/payments/<int:payment_id>', methods=['DELETE'])(delete_payment)

    migrate = Migrate(app, db)

    return app


app = __create_app(Config, db)

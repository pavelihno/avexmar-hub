import os
import importlib
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

from app.config import Config
from app.database import db
from app.utils.email import init_mail
from app.middlewares.error_handler import register_error_handlers

from app.controllers._dev_controller import *
from app.controllers.auth_controller import *
from app.controllers.user_controller import *
from app.controllers.airport_controller import *
from app.controllers.aircraft_controller import *
from app.controllers.route_controller import *
from app.controllers.flight_controller import *
from app.controllers.tariff_controller import *
from app.controllers.flight_tariff_controller import *
from app.controllers.discount_controller import *
from app.controllers.seat_controller import *
from app.controllers.passenger_controller import *
from app.controllers.booking_controller import *
from app.controllers.booking_passenger_controller import *
from app.controllers.ticket_controller import *
from app.controllers.payment_controller import *
from app.controllers.airline_controller import *
from app.controllers.country_controller import *
from app.controllers.search_controller import *
from app.controllers.timezone_controller import *
from app.controllers.price_controller import *
from app.controllers.fee_controller import *


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
    CORS(app, resources={r"/*": {'origins': Config.CORS_ORIGINS}})

    # Required for tracking migrations
    __import_models()

    _db.init_app(app)
    init_mail(app)
    register_error_handlers(app)

    # auth
    app.route('/register', methods=['POST'])(register)
    app.route('/login', methods=['POST'])(login)
    app.route('/auth', methods=['GET'])(auth)
    app.route('/forgot_password', methods=['POST'])(forgot_password)
    app.route('/reset_password', methods=['POST'])(reset_password)

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
    app.route('/airports/<int:airport_id>', methods=['GET'])(get_airport)
    app.route('/airports/<int:airport_id>', methods=['PUT'])(update_airport)
    app.route('/airports/<int:airport_id>', methods=['DELETE'])(delete_airport)
    app.route('/airports/upload', methods=['POST'])(upload_airport)
    app.route('/airports/template', methods=['GET'])(get_airport_template)

    # aircrafts
    app.route('/aircrafts', methods=['GET'])(get_aircrafts)
    app.route('/aircrafts', methods=['POST'])(create_aircraft)
    app.route('/aircrafts/<int:aircraft_id>', methods=['GET'])(get_aircraft)
    app.route('/aircrafts/<int:aircraft_id>', methods=['PUT'])(update_aircraft)
    app.route('/aircrafts/<int:aircraft_id>', methods=['DELETE'])(delete_aircraft)

    # airlines
    app.route('/airlines', methods=['GET'])(get_airlines)
    app.route('/airlines', methods=['POST'])(create_airline)
    app.route('/airlines/<int:airline_id>', methods=['GET'])(get_airline)
    app.route('/airlines/<int:airline_id>', methods=['PUT'])(update_airline)
    app.route('/airlines/<int:airline_id>', methods=['DELETE'])(delete_airline)
    app.route('/airlines/upload', methods=['POST'])(upload_airline)
    app.route('/airlines/template', methods=['GET'])(get_airline_template)

    # countries
    app.route('/countries', methods=['GET'])(get_countries)
    app.route('/countries', methods=['POST'])(create_country)
    app.route('/countries/<int:country_id>', methods=['GET'])(get_country)
    app.route('/countries/<int:country_id>', methods=['PUT'])(update_country)
    app.route('/countries/<int:country_id>', methods=['DELETE'])(delete_country)
    app.route('/countries/upload', methods=['POST'])(upload_country)
    app.route('/countries/template', methods=['GET'])(get_country_template)

    # timezones
    app.route('/timezones', methods=['GET'])(get_timezones)
    app.route('/timezones', methods=['POST'])(create_timezone)
    app.route('/timezones/<int:timezone_id>', methods=['GET'])(get_timezone)
    app.route('/timezones/<int:timezone_id>', methods=['PUT'])(update_timezone)
    app.route('/timezones/<int:timezone_id>', methods=['DELETE'])(delete_timezone)
    app.route('/timezones/upload', methods=['POST'])(upload_timezone)
    app.route('/timezones/template', methods=['GET'])(get_timezone_template)

    # routes
    app.route('/routes', methods=['GET'])(get_routes)
    app.route('/routes', methods=['POST'])(create_route)
    app.route('/routes/<int:route_id>', methods=['GET'])(get_route)
    app.route('/routes/<int:route_id>', methods=['PUT'])(update_route)
    app.route('/routes/<int:route_id>', methods=['DELETE'])(delete_route)

    # flights
    app.route('/flights', methods=['GET'])(get_flights)
    app.route('/flights', methods=['POST'])(create_flight)
    app.route('/flights/<int:flight_id>', methods=['GET'])(get_flight)
    app.route('/flights/<int:flight_id>', methods=['PUT'])(update_flight)
    app.route('/flights/<int:flight_id>', methods=['DELETE'])(delete_flight)
    app.route('/flights/upload', methods=['POST'])(upload_flight)
    app.route('/flights/template', methods=['GET'])(get_flight_template)

    # tariffs
    app.route('/tariffs', methods=['GET'])(get_tariffs)
    app.route('/tariffs', methods=['POST'])(create_tariff)
    app.route('/tariffs/<int:tariff_id>', methods=['GET'])(get_tariff)
    app.route('/tariffs/<int:tariff_id>', methods=['PUT'])(update_tariff)
    app.route('/tariffs/<int:tariff_id>', methods=['DELETE'])(delete_tariff)

    # flight tariffs
    app.route('/flight_tariffs', methods=['GET'])(get_flight_tariffs)
    app.route('/flight_tariffs', methods=['POST'])(create_flight_tariff)
    app.route('/flight_tariffs/<int:flight_tariff_id>', methods=['GET'])(get_flight_tariff)
    app.route('/flight_tariffs/<int:flight_tariff_id>', methods=['PUT'])(update_flight_tariff)
    app.route('/flight_tariffs/<int:flight_tariff_id>', methods=['DELETE'])(delete_flight_tariff)

    # discounts
    app.route('/discounts', methods=['GET'])(get_discounts)
    app.route('/discounts', methods=['POST'])(create_discount)
    app.route('/discounts/<int:discount_id>', methods=['GET'])(get_discount)
    app.route('/discounts/<int:discount_id>', methods=['PUT'])(update_discount)
    app.route('/discounts/<int:discount_id>', methods=['DELETE'])(delete_discount)

    # seats
    app.route('/seats', methods=['GET'])(get_seats)
    app.route('/seats', methods=['POST'])(create_seat)
    app.route('/seats/<int:seat_id>', methods=['GET'])(get_seat)
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
    app.route('/bookings/<int:booking_id>', methods=['GET'])(get_booking)
    app.route('/bookings/<int:booking_id>', methods=['PUT'])(update_booking)
    app.route('/bookings/<int:booking_id>', methods=['DELETE'])(delete_booking)

    # booking passengers
    app.route('/booking_passengers', methods=['GET'])(get_booking_passengers)
    app.route('/booking_passengers', methods=['POST'])(create_booking_passenger)
    app.route('/booking_passengers/<int:booking_passenger_id>', methods=['GET'])(get_booking_passenger)
    app.route('/booking_passengers/<int:booking_passenger_id>', methods=['PUT'])(update_booking_passenger)
    app.route('/booking_passengers/<int:booking_passenger_id>', methods=['DELETE'])(delete_booking_passenger)

    # tickets
    app.route('/tickets', methods=['GET'])(get_tickets)
    app.route('/tickets', methods=['POST'])(create_ticket)
    app.route('/tickets/<int:ticket_id>', methods=['GET'])(get_ticket)
    app.route('/tickets/<int:ticket_id>', methods=['PUT'])(update_ticket)
    app.route('/tickets/<int:ticket_id>', methods=['DELETE'])(delete_ticket)

    # payments
    app.route('/payments', methods=['GET'])(get_payments)
    app.route('/payments', methods=['POST'])(create_payment)
    app.route('/payments/<int:payment_id>', methods=['GET'])(get_payment)
    app.route('/payments/<int:payment_id>', methods=['PUT'])(update_payment)
    app.route('/payments/<int:payment_id>', methods=['DELETE'])(delete_payment)

    # search
    app.route('/search/airports', methods=['GET'])(search_airports)
    app.route('/search/flights', methods=['GET'])(search_flights)
    app.route('/search/flights/nearby', methods=['GET'])(search_nearby_flights)
    app.route('/search/flights/schedule', methods=['GET'])(schedule_flights)

    # price
    app.route('/price/calculate', methods=['POST'])(calculate_price)

    # fees
    app.route('/fees', methods=['GET'])(get_fees)
    app.route('/fees', methods=['POST'])(create_fee)
    app.route('/fees/<int:fee_id>', methods=['GET'])(get_fee)
    app.route('/fees/<int:fee_id>', methods=['PUT'])(update_fee)
    app.route('/fees/<int:fee_id>', methods=['DELETE'])(delete_fee)

    # dev
    app.route('/dev/clear/<string:table_name>', methods=['DELETE'])(clear_table)

    migrate = Migrate(app, db)

    return app


app = __create_app(Config, db)

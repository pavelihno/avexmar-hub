from flask import jsonify

from app.config import Config
from app.middlewares.auth_middleware import dev_tool
from app.models.airport import Airport
from app.models.airline import Airline
from app.models.country import Country
from app.models.route import Route
from app.models.flight import Flight
from app.models.tariff import Tariff
from app.models.discount import Discount
from app.models.seat import Seat
from app.models.passenger import Passenger
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.user import User
from app.models.ticket import Ticket


MODEL_MAP = {
    'airports': Airport,
    'airlines': Airline,
    'countries': Country,
    'routes': Route,
    'flights': Flight,
    'tariffs': Tariff,
    'discounts': Discount,
    'seats': Seat,
    'passengers': Passenger,
    'bookings': Booking,
    'payments': Payment,
    'tickets': Ticket,
    'users': User,
}


@dev_tool
def clear_table(current_user, table_name: str):

    model = MODEL_MAP.get(table_name)
    if not model:
        return jsonify({'message': 'Invalid table name'}), 404

    deleted = model.delete_all()

    return jsonify({'deleted': deleted})

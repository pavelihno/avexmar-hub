from flask import jsonify

from app.middlewares.auth_middleware import dev_tool
from app.models.airport import Airport
from app.models.airline import Airline
from app.models.aircraft import Aircraft
from app.models.country import Country
from app.models.route import Route
from app.models.flight import Flight
from app.models.tariff import Tariff
from app.models.discount import Discount
from app.models.fee import Fee
from app.models.passenger import Passenger
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.user import User
from app.models.timezone import Timezone
from app.models.consent import ConsentDoc, ConsentEvent


MODEL_MAP = {
    'airports': Airport,
    'airlines': Airline,
    'aircrafts': Aircraft,
    'countries': Country,
    'timezones': Timezone,
    'routes': Route,
    'flights': Flight,
    'tariffs': Tariff,
    'discounts': Discount,
    'fees': Fee,
    'passengers': Passenger,
    'bookings': Booking,
    'payments': Payment,
    'users': User,
    'consent_docs': ConsentDoc,
    'consent_events': ConsentEvent,
}


@dev_tool
def clear_table(current_user, table_name: str):

    model = MODEL_MAP.get(table_name)
    if not model:
        return jsonify({'message': 'Invalid table name'}), 404

    deleted = model.delete_all(commit=True)

    return jsonify({'deleted': deleted})

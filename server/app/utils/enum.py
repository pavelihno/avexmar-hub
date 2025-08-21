
import enum


class USER_ROLE(enum.Enum):
    admin = 'admin'
    standard = 'standard'


class BOOKING_STATUS(enum.Enum):
    created = 'created'
    passengers_added = 'passengers_added'
    confirmed = 'confirmed'
    payment_pending = 'payment_pending'
    payment_confirmed = 'payment_confirmed'
    payment_failed = 'payment_failed'
    completed = 'completed'
    expired = 'expired'
    cancelled = 'cancelled'


class DISCOUNT_TYPE(enum.Enum):
    round_trip = 'round_trip'
    infant = 'infant'
    child = 'child'


class GENDER(enum.Enum):
    м = 'м'
    ж = 'ж'


class DOCUMENT_TYPE(enum.Enum):
    passport = 'passport'
    foreign_passport = 'foreign_passport'
    international_passport = 'international_passport'
    birth_certificate = 'birth_certificate'


class PASSENGER_CATEGORY(enum.Enum):
    adult = 'adult'
    child = 'child'
    infant = 'infant'
    infant_seat = 'infant_seat'


class PASSENGER_PLURAL_CATEGORY(enum.Enum):
    adults = 'adults'
    children = 'children'
    infants = 'infants'
    infants_seat = 'infants_seat'

class CURRENCY(enum.Enum):
    rub = 'rub'


class SEAT_CLASS(enum.Enum):
    economy = 'economy'
    business = 'business'


class PAYMENT_STATUS(enum.Enum):
    pending = 'pending'
    waiting_for_capture = 'waiting_for_capture'
    succeeded = 'succeeded'
    canceled = 'canceled'


class PAYMENT_METHOD(enum.Enum):
    yookassa = 'yookassa'


class FEE_APPLICATION(enum.Enum):
    booking = 'booking'
    cancellation = 'cancellation'


class FEE_TERM(enum.Enum):
    none = 'none'
    before_24h = 'before_24h'
    within_24h = 'within_24h'
    after_departure = 'after_departure'


class CONSENT_DOC_TYPE(enum.Enum):
    offer = 'offer'
    pd_policy = 'pd_policy'


class CONSENT_EVENT_TYPE(enum.Enum):
    offer_acceptance = 'offer_acceptance'
    pd_processing = 'pd_processing'


class CONSENT_ACTION(enum.Enum):
    agree = 'agree'
    withdraw = 'withdraw'


# Default variables
DEFAULT_USER_ROLE = USER_ROLE.standard
DEFAULT_BOOKING_STATUS = BOOKING_STATUS.created
DEFAULT_CURRENCY = CURRENCY.rub
DEFAULT_PAYMENT_STATUS = PAYMENT_STATUS.pending
DEFAULT_PASSENGER_CATEGORY = PASSENGER_CATEGORY.adult
DEFAULT_FEE_APPLICATION = FEE_APPLICATION.booking
DEFAULT_FEE_TERM = FEE_TERM.none

# Other variables
DEFAULT_CITIZENSHIP_CODE = 'RU'

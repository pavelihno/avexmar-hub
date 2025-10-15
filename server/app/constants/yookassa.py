class YooKassaMessages:
    @staticmethod
    def unknown_event_type(event: str) -> str:
        return f'Unknown event type: {event}'


YOOKASSA_RECEIPT_DESCRIPTION_TEMPLATE = (
    'Организация авиаперевозки пассажиров и багажа по маршруту {origin} — {destination}. {seat_class} класс. {date}. {passenger}'
)

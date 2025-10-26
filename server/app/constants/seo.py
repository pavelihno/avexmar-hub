class SEOText:
    """Text templates for SEO pages"""

    # Schema.org constants
    SCHEMA_CONTEXT = 'https://schema.org'
    SCHEMA_IN_STOCK = 'https://schema.org/InStock'
    SCHEMA_SOLD_OUT = 'https://schema.org/SoldOut'

    # Default time value
    DEFAULT_TIME = '00:00'

    # Description templates
    SCHEDULE_FLIGHTS = 'Расписание рейсов {route_title}'
    ON_DATE = 'на {human_date}'
    PRICES_FROM = 'цены от {lowest_price} РУБ'

    FLIGHT_TICKETS = 'Авиабилеты {route_title}'
    FROM_PRICE = 'от {cheapest} РУБ'

    # Title templates
    SCHEDULE_TITLE = '{route_title} — расписание и билеты'
    SEARCH_TITLE = 'Поиск билетов {route_title}'

    # Route separator
    ROUTE_SEPARATOR = ' — '

    # Punctuation
    DESCRIPTION_SEPARATOR = ', '
    DESCRIPTION_END = '.'

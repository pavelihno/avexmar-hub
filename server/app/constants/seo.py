class SEOText:

    # Schema.org constants
    SCHEMA_CONTEXT = 'https://schema.org'
    SCHEMA_IN_STOCK = 'https://schema.org/InStock'
    SCHEMA_SOLD_OUT = 'https://schema.org/SoldOut'

    # Schema.org types
    SCHEMA_TYPE_SITE_NAVIGATION = 'SiteNavigationElement'
    SCHEMA_TYPE_ITEM_LIST = 'ItemList'
    SCHEMA_TYPE_OFFER = 'Offer'
    SCHEMA_TYPE_AIRPORT = 'Airport'
    SCHEMA_TYPE_FLIGHT = 'Flight'
    SCHEMA_TYPE_AIRLINE = 'Airline'

    # Default time value
    DEFAULT_TIME = '00:00'

    # Filename templates
    PRERENDER_FILENAME = 'schedule_{origin_code}-{dest_code}.html'

    # URL path templates
    SCHEDULE_PATH = '/schedule/{slug}'
    SCHEDULE_SLUG = '{origin_code}/{dest_code}'

    # Description templates
    SCHEDULE_FLIGHTS = 'Расписание рейсов {route_title}'
    ON_DATE = 'на {date}'
    PRICES_FROM = 'цены от {lowest_price} РУБ'

    # Title templates
    SCHEDULE_TITLE = '{route_title} — расписание и билеты'

    # Navigation templates
    NAVIGATION_SCHEDULE_LABEL = 'Расписание {origin_city} — {dest_city}'

    # Route separator
    ROUTE_SEPARATOR = ' — '

    # Punctuation
    DESCRIPTION_SEPARATOR = ', '
    DESCRIPTION_END = '.'

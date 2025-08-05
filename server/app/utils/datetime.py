from datetime import datetime, time, date


def parse_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value, '%d.%m.%Y').date()
    return value


def parse_time(value):
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, str):
        return datetime.strptime(value, '%H:%M').time()
    return value


def get_datetime(date_value, time_value):
    date_value = parse_date(date_value)
    time_value = parse_time(time_value)

    return datetime.combine(
        date_value,
        time_value or time()
    )

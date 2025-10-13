from datetime import datetime, date, time
from numbers import Number

from app.constants.messages import DateTimeMessages

DATE_FORMATS = [
    '%d.%m.%Y',
    '%Y-%m-%d',
    '%Y/%m/%d',
]

TIME_FORMATS = [
    '%H:%M',
    '%H:%M:%S',
]

WRITE_DATE_FORMAT = '%d.%m.%Y'
WRITE_TIME_FORMAT = '%H:%M'
WRITE_DATETIME_FORMAT = f'{WRITE_DATE_FORMAT} {WRITE_TIME_FORMAT}'


def parse_date(value) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, Number):
        return datetime.fromtimestamp(value).date()
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        raise ValueError(DateTimeMessages.does_not_match_formats(value, DATE_FORMATS))
    if value is None:
        return None
    raise TypeError(DateTimeMessages.unsupported_type('date', type(value)))


def parse_time(value) -> time | None:
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, Number):
        return datetime.fromtimestamp(value).time()
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        for fmt in TIME_FORMATS:
            try:
                return datetime.strptime(s, fmt).time()
            except ValueError:
                continue
        raise ValueError(DateTimeMessages.does_not_match_formats(value, TIME_FORMATS))
    if value is None:
        return None
    raise TypeError(DateTimeMessages.unsupported_type('time', type(value)))


def parse_datetime(value) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, Number):
        return datetime.fromtimestamp(value)
    if isinstance(value, str):
        s = value.strip()
        try:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        except ValueError:
            pass
        raise ValueError(DateTimeMessages.invalid_iso_format(value))
    if value is None:
        return None
    raise TypeError(DateTimeMessages.unsupported_type('datetime', type(value)))


def combine_date_time(date_value, time_value=None) -> datetime | None:
    date_value = parse_date(date_value)
    time_value = parse_time(time_value)

    if date_value is None:
        return None

    return datetime.combine(date_value, time_value or time())


def format_date(value, fmt: str = WRITE_DATE_FORMAT) -> str:
    d = parse_date(value)
    return d.strftime(fmt) if d else ''


def format_time(value, fmt: str = WRITE_TIME_FORMAT) -> str:
    t = parse_time(value)
    return t.strftime(fmt) if t else ''


def format_datetime(value, datetime_fmt: str = WRITE_DATETIME_FORMAT) -> str:
    dt = parse_datetime(value)
    return dt.strftime(datetime_fmt) if dt else ''

from datetime import datetime, date, time
from numbers import Number

from app.constants.messages import DateTimeMessages

DATE_FORMATS = [
    '%d.%m.%Y',
    '%d.%m.%y',
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


def parse_date(value: str, fmt: str) -> date | None:
    if not value or (isinstance(value, str) and not value.strip()):
        return None
    return datetime.strptime(value, fmt).date()


def parse_time(value: str, fmt: str) -> time | None:
    if not value or (isinstance(value, str) and not value.strip()):
        return None
    return datetime.strptime(value, fmt).time()


def parse_date_formats(value) -> date | None:
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
                return parse_date(s, fmt)
            except ValueError:
                continue
        raise ValueError(DateTimeMessages.does_not_match_formats(value, DATE_FORMATS))
    if value is None:
        return None
    raise TypeError(DateTimeMessages.unsupported_type('date', type(value)))


def parse_time_formats(value) -> time | None:
    if isinstance(value, time) and not isinstance(value, datetime):
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
                return parse_time(s, fmt)
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
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        except ValueError:
            pass
        raise ValueError(DateTimeMessages.invalid_iso_format(value))
    if value is None:
        return None
    raise TypeError(DateTimeMessages.unsupported_type('datetime', type(value)))


def combine_date_time(date_value, time_value=None) -> datetime | None:
    date_value = parse_date_formats(date_value)
    time_value = parse_time_formats(time_value)

    if date_value is None:
        return None

    return datetime.combine(date_value, time_value or time())


def format_date(value, fmt: str = WRITE_DATE_FORMAT) -> str:
    d = parse_date_formats(value)
    return d.strftime(fmt) if d else ''


def format_time(value, fmt: str = WRITE_TIME_FORMAT) -> str:
    t = parse_time_formats(value)
    return t.strftime(fmt) if t else ''


def format_datetime(value, datetime_fmt: str = WRITE_DATETIME_FORMAT) -> str:
    dt = parse_datetime(value)
    return dt.strftime(datetime_fmt) if dt else ''

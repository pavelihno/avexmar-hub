from datetime import datetime, date, time as time_
from typing import Optional, Tuple, Union

import dateutil.parser


def split_iso_datetime(iso):
    if not iso:
        return None, None

    dt = iso if isinstance(iso, datetime) else dateutil.parser.isoparse(iso)

    return dt.date(), dt.time().replace(microsecond=0, tzinfo=None)

from dataclasses import dataclass
from typing import Callable, Dict, List, Mapping, Optional, Sequence, Tuple

from app.utils.enum import (
    PASSENGER_CATEGORY,
    PASSENGER_PLURAL_CATEGORY,
    DISCOUNT_TYPE,
    SEAT_CLASS,
)


@dataclass(frozen=True)
class PassengerCategoryInfo:
    """Metadata describing a passenger category"""

    category: PASSENGER_CATEGORY
    plural: PASSENGER_PLURAL_CATEGORY
    label: str
    plural_label: str
    requires_seat: bool
    age_validation: Sequence[Tuple[str, Callable[[int], bool]]]


PASSENGER_CATEGORY_INFOS: Tuple[PassengerCategoryInfo, ...] = (
    PassengerCategoryInfo(
        category=PASSENGER_CATEGORY.adult,
        plural=PASSENGER_PLURAL_CATEGORY.adults,
        label='Взрослый',
        plural_label='Взрослые',
        requires_seat=True,
        age_validation=(
            ('ADULT', lambda age: age < 12),
        ),
    ),
    PassengerCategoryInfo(
        category=PASSENGER_CATEGORY.child,
        plural=PASSENGER_PLURAL_CATEGORY.children,
        label='Ребёнок',
        plural_label='Дети',
        requires_seat=True,
        age_validation=(
            ('CHILD', lambda age: age < 2),
            ('CHILD', lambda age: age > 12),
        ),
    ),
    PassengerCategoryInfo(
        category=PASSENGER_CATEGORY.infant,
        plural=PASSENGER_PLURAL_CATEGORY.infants,
        label='Младенец',
        plural_label='Младенцы',
        requires_seat=False,
        age_validation=(
            ('INFANT', lambda age: age >= 2),
        ),
    ),
    PassengerCategoryInfo(
        category=PASSENGER_CATEGORY.infant_seat,
        plural=PASSENGER_PLURAL_CATEGORY.infants_seat,
        label='Младенец с местом',
        plural_label='Младенцы с местом',
        requires_seat=True,
        age_validation=(
            ('INFANT', lambda age: age >= 2),
        ),
    ),
)

PASSENGER_CATEGORY_MAP: Dict[PASSENGER_CATEGORY, PassengerCategoryInfo] = {
    info.category: info for info in PASSENGER_CATEGORY_INFOS
}
PASSENGER_PLURAL_MAP: Dict[PASSENGER_PLURAL_CATEGORY, PassengerCategoryInfo] = {
    info.plural: info for info in PASSENGER_CATEGORY_INFOS
}

DEFAULT_PASSENGER_CATEGORY = PASSENGER_CATEGORY.adult
PASSENGER_WITH_SEAT_CATEGORIES: Tuple[PASSENGER_CATEGORY, ...] = tuple(
    info.category for info in PASSENGER_CATEGORY_INFOS if info.requires_seat
)
PASSENGER_CATEGORY_LABELS = {
    info.category.value: info.label for info in PASSENGER_CATEGORY_INFOS
}
PASSENGERS_LABELS = {
    info.plural.value: info.plural_label for info in PASSENGER_CATEGORY_INFOS
}


def get_category_info(
    category: PASSENGER_CATEGORY | PASSENGER_PLURAL_CATEGORY,
) -> Optional[PassengerCategoryInfo]:
    if isinstance(category, PASSENGER_CATEGORY):
        return PASSENGER_CATEGORY_MAP.get(category)
    return PASSENGER_PLURAL_MAP.get(category)


def get_plural_category(
    category: PASSENGER_CATEGORY,
) -> Optional[PASSENGER_PLURAL_CATEGORY]:
    info = PASSENGER_CATEGORY_MAP.get(category)
    return info.plural if info else None


def get_category_from_plural(
    plural: PASSENGER_PLURAL_CATEGORY,
) -> Optional[PASSENGER_CATEGORY]:
    info = PASSENGER_PLURAL_MAP.get(plural)
    return info.category if info else None


def category_requires_seat(category: PASSENGER_CATEGORY) -> bool:
    info = PASSENGER_CATEGORY_MAP.get(category)
    return bool(info and info.requires_seat)


def get_age_validation_rules(
    category: PASSENGER_CATEGORY,
) -> Sequence[Tuple[str, Callable[[int], bool]]]:
    info = PASSENGER_CATEGORY_MAP.get(category)
    return info.age_validation if info else ()


def get_applicable_discount_types(
    category: PASSENGER_CATEGORY,
    seat_class: SEAT_CLASS,
    is_round_trip: bool,
) -> Tuple[DISCOUNT_TYPE, ...]:
    """Return a tuple of discounts that should be applied for the category"""

    discounts: List[DISCOUNT_TYPE] = []

    if category == PASSENGER_CATEGORY.infant:
        discounts.append(DISCOUNT_TYPE.infant)

    if seat_class == SEAT_CLASS.economy:
        if category in (PASSENGER_CATEGORY.child, PASSENGER_CATEGORY.infant_seat):
            discounts.append(DISCOUNT_TYPE.child)
        if is_round_trip:
            discounts.append(DISCOUNT_TYPE.round_trip)

    return tuple(discounts)


def get_category_discount_multiplier(
    category: PASSENGER_CATEGORY,
    seat_class: SEAT_CLASS,
    is_round_trip: bool,
    discount_percentages: Mapping[str, float],
    discount_names_map: Mapping[str, str],
) -> Tuple[float, List[str]]:
    """
    Calculate the combined tariff multiplier for a passenger category.

    Returns a tuple of the multiplier and the list of human readable discount
    names that were applied
    """

    multiplier = 1.0
    applied_names: List[str] = []

    for discount in get_applicable_discount_types(category, seat_class, is_round_trip):
        key = discount.value
        pct = discount_percentages.get(key, 0.0)
        multiplier *= (1.0 - pct)
        name = discount_names_map.get(key)
        if name:
            applied_names.append(name)

    return multiplier, applied_names

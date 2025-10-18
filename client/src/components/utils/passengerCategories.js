import { differenceInYears } from 'date-fns';

import { MAX_PASSENGERS, VALIDATION_MESSAGES } from '../../constants';
import { parseDate } from './format';

const ADULT_KEY = 'adult';
const ADULTS_KEY = 'adults';
const CHILD_KEY = 'child';
const CHILDREN_KEY = 'children';
const INFANT_KEY = 'infant';
const INFANTS_KEY = 'infants';
const INFANT_SEAT_KEY = 'infant_seat';
const INFANTS_SEAT_KEY = 'infants_seat';

const AGE_RULE = (key, predicate) => ({ key, predicate });

export const PASSENGER_CATEGORIES = [
	{
		category: ADULT_KEY,
		plural: ADULTS_KEY,
		requiresSeat: true,
		ageValidation: [AGE_RULE('ADULT', (age) => age < 12)],
	},
	{
		category: CHILD_KEY,
		plural: CHILDREN_KEY,
		requiresSeat: true,
		ageValidation: [AGE_RULE('CHILD', (age) => age < 2), AGE_RULE('CHILD', (age) => age > 12)],
	},
	{
		category: INFANT_KEY,
		plural: INFANTS_KEY,
		requiresSeat: false,
		ageValidation: [AGE_RULE('INFANT', (age) => age >= 2)],
	},
	{
		category: INFANT_SEAT_KEY,
		plural: INFANTS_SEAT_KEY,
		requiresSeat: true,
		ageValidation: [AGE_RULE('INFANT', (age) => age >= 2)],
	},
];

const CATEGORY_BY_KEY = new Map(PASSENGER_CATEGORIES.map((info) => [info.category, info]));
const CATEGORY_BY_PLURAL = new Map(PASSENGER_CATEGORIES.map((info) => [info.plural, info]));

export const PASSENGER_WITH_SEAT_CATEGORIES = PASSENGER_CATEGORIES.filter((info) => info.requiresSeat).map(
	(info) => info.category
);

export const PASSENGER_WITH_SEAT_PLURALS = PASSENGER_CATEGORIES.filter((info) => info.requiresSeat).map(
	(info) => info.plural
);

export const getPassengerCategoryInfo = (category) => CATEGORY_BY_KEY.get(category) || null;
export const getPassengerCategoryInfoByPlural = (plural) => CATEGORY_BY_PLURAL.get(plural) || null;

export const getPluralFromCategory = (category) => getPassengerCategoryInfo(category)?.plural || null;
export const getCategoryFromPlural = (plural) => getPassengerCategoryInfoByPlural(plural)?.category || null;

export const getApplicableDiscountTypes = (category, seatClass, isRoundTrip) => {
	const types = [];
	if (category === INFANT_KEY) {
		types.push('infant');
	}
	if (seatClass === 'economy') {
		if ([CHILD_KEY, INFANT_SEAT_KEY].includes(category)) {
			types.push('child');
		}
		if (isRoundTrip) {
			types.push('round_trip');
		}
	}
	return types;
};

export const getTotalPassengers = (passengers = {}) =>
	PASSENGER_CATEGORIES.reduce((acc, info) => acc + (Number(passengers[info.plural]) || 0), 0);

export const getSeatsNumber = (passengers = {}) =>
	PASSENGER_CATEGORIES.reduce((acc, info) => acc + (info.requiresSeat ? Number(passengers[info.plural]) || 0 : 0), 0);

export const disabledPassengerChange = (passengers, key, delta) => {
	const currentValue = Number(passengers[key]) || 0;
	const nextValue = currentValue + delta;
	const minValue = key === ADULTS_KEY ? 1 : 0;

	if (nextValue < minValue) {
		return true;
	}

	const newTotal = getTotalPassengers(passengers) + delta;
	if (newTotal > MAX_PASSENGERS) {
		return true;
	}

	if (key === INFANTS_KEY && delta === 1) {
		const adults = Number(passengers[ADULTS_KEY]) || 0;
		if (nextValue > adults) {
			return true;
		}
	}

	if (key === ADULTS_KEY && delta === -1) {
		const nextAdults = nextValue;
		const infants = Number(passengers[INFANTS_KEY]) || 0;
		if (infants > nextAdults) {
			return true;
		}
	}

	return false;
};

export const getAgeError = (passengerCategory, birthDate, flightDate) => {
	if (!birthDate) {
		return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
	}

	const birth = parseDate(birthDate);
	if (birth && birth > new Date()) {
		return VALIDATION_MESSAGES.PASSENGER.birth_date.FUTURE;
	}

	const flight = parseDate(flightDate);
	if (!birth || !flight) {
		return '';
	}

	const age = differenceInYears(flight, birth);
	const info = getPassengerCategoryInfo(passengerCategory);
	if (!info) {
		return '';
	}

	for (const rule of info.ageValidation) {
		if (rule.predicate(age)) {
			return VALIDATION_MESSAGES.PASSENGER.birth_date[rule.key] || '';
		}
	}

	return '';
};

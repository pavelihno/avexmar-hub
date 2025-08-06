import { format, parse } from 'date-fns';
import numeral from 'numeral';

import {
	dateLocale,
	DATE_FORMAT,
	TIME_FORMAT,
	DATETIME_FORMAT,
	TIME_DURATION_FORMAT,
	DEFAULT_NUMBER_FORMAT,
} from '../../constants';

export const formatDate = (value, dateFormat = DATE_FORMAT, locale = dateLocale) => {
	if (!value) return '';
	try {
		if (typeof value === 'string') {
			return format(new Date(value), dateFormat, { locale });
		} else if (value instanceof Date) {
			return format(value, dateFormat, { locale });
		} else if (typeof value === 'number') {
			const date = new Date(value);
			if (isNaN(date.getDate())) {
				throw new Error('Invalid date value');
			}
			return format(date, dateFormat, { locale });
		} else {
			throw new Error('Unsupported date value type');
		}
	} catch (error) {
		console.error('Invalid date value:', value);
		return value;
	}
};

export const formatTime = (value, timeFormat = TIME_FORMAT) => {
	if (!value) return '';
	try {
		if (typeof value === 'string') {
			return format(new Date(`1970-01-01T${value}`), timeFormat);
		} else if (value instanceof Date) {
			return format(value, timeFormat);
		} else if (typeof value === 'number') {
			const date = new Date(value);
			if (isNaN(date.getTime())) {
				throw new Error('Invalid time value');
			}
			return format(date, timeFormat);
		} else {
			throw new Error('Unsupported time value type');
		}
	} catch (error) {
		console.error('Invalid time value:', value);
		return value;
	}
};

export const formatDateTime = (value, dateTimeFormat = DATETIME_FORMAT) => {
	if (!value) return '';
	try {
		return format(new Date(value), dateTimeFormat);
	} catch (error) {
		console.error('Invalid datetime value:', value);
		return value;
	}
};

export const formatTimeToAPI = (value) => {
	if (!value) return '';
	try {
		return format(value, 'HH:mm:ss');
	} catch (error) {
		console.error('Invalid time value (API):', value);
		return value;
	}
};

export const formatTimeToUI = (value) => {
	if (!value) return '';
	try {
		return new Date(`1970-01-01T${value}`);
	} catch (error) {
		console.error('Invalid time value (UI):', value);
		return value;
	}
};

export const formatDuration = (minutes) => {
	if (minutes == null) return '';
	const hrs = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return TIME_DURATION_FORMAT(hrs, mins);
};

export const formatNumber = (value, formatString = DEFAULT_NUMBER_FORMAT) => {
	if (value == null || isNaN(value)) return '';
	try {
		return numeral(value).format(formatString);
	} catch (error) {
		console.error('Invalid number value:', value);
		return value;
	}
};

export const parseTime = (value) => {
	if (!value) return '';
	try {
		const date = new Date(`1970-01-01T${value}`);
		if (isNaN(date.getTime())) {
			throw new Error('Invalid time format');
		}
		return date.getTime();
	} catch (error) {
		console.error('Invalid time value:', value);
		return value;
	}
};

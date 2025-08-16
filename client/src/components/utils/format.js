import { format } from 'date-fns';
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

export const parseDate = (value) => {
        try {
                let d;
                if (value == null) {
                        d = new Date();
                } else if (value instanceof Date) {
                        d = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
                } else if (typeof value === 'string') {
                        const s = value.trim();
                        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                                const [y, m, day] = s.split('-').map(Number);
                                d = new Date(Date.UTC(y, m - 1, day));
                        } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
                                const [day, m, y] = s.split('.').map(Number);
                                d = new Date(Date.UTC(y, m - 1, day));
                        } else {
                                d = new Date(s);
                        }
                } else if (typeof value === 'number') {
                        d = new Date(value);
                } else {
                        return null;
                }

                if (isNaN(d.getTime())) return null;

                const normalized = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
                normalized.toJSON = () => format(normalized, 'yyyy-MM-dd');
                return normalized;
        } catch (error) {
                console.error('Invalid date value:', value);
                return null;
        }
};

export const parseTime = (value) => {
        if (!value) return null;
        try {
                let d;
                if (value instanceof Date) {
                        d = value;
                } else if (typeof value === 'number') {
                        d = new Date(value);
                } else if (typeof value === 'string') {
                        d = new Date(`1970-01-01T${value}`);
                } else {
                        return null;
                }

                if (isNaN(d.getTime())) return null;

                const normalized = new Date(d.getTime());
                normalized.toJSON = () => format(normalized, 'HH:mm:ss');
                return normalized;
        } catch (error) {
                console.error('Invalid time value:', value);
                return null;
        }
};

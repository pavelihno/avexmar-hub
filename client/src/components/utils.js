import { format } from 'date-fns';
import { DATE_FORMAT, TIME_FORMAT, DATETIME_FORMAT } from '../constants/formats';

export const formatDate = (value, dateFormat = DATE_FORMAT) => {
	if (!value) return '';
	try {
		return format(new Date(value), dateFormat);
	} catch (error) {
		console.error('Invalid date value:', value);
		return value;
	}
};

export const formatTime = (value, timeFormat = TIME_FORMAT) => {
	if (!value) return '';
	try {
		return format(new Date(`1970-01-01T${value}`), timeFormat);
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

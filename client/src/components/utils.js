import { format, parse, isValid } from 'date-fns';
import { DATE_FORMAT, TIME_FORMAT, DATETIME_FORMAT } from '../constants/formats';

export const FIELD_TYPES = {};

export const createFieldRenderer = (field, defaultProps = {}) => {};

export const createFormFields = (fields) => {};

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

export const validateDate = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid date value:', value);
		return false;
	}
};

export const validateTime = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid time value:', value);
		return false;
	}
};

export const validateDateTime = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid datetime value:', value);
		return false;
	}
};

export const validateEmail = (value) => {
	// RFC 5322
	if (!value) return false;
	const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
	return emailRegex.test(value);
};

export const validatePhoneNumber = (value) => {
	// E.164 format: +1234567890
	if (!value) return false;
	const phoneRegex = /^\+[1-9]\d{9,14}$/;
	return phoneRegex.test(value);
};

export const isDuplicateInBooking = (
	allBookingPassengers,
	passengers,
	bookingId,
	firstName,
	lastName,
	birthDate,
	ignoreId = null
) => {
	const bookingPassengers = allBookingPassengers.filter((bp) => {
		if (bp.booking_id !== bookingId || bp.id === ignoreId) return false;
		return true;
	});

	return bookingPassengers.some((bp) => {
		const passenger = passengers.find((pass) => pass.id === bp.passenger_id);
		return (
			passenger &&
			passenger.first_name === firstName &&
			passenger.last_name === lastName &&
			passenger.birth_date === formatDate(birthDate, 'yyyy-MM-dd')
		);
	});
};

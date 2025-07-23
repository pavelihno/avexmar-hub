import { format, parse, isValid } from 'date-fns';
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

export const isDuplicateInBooking = (
        bookingPassengers,
        passengers,
        bookingId,
        firstName,
        lastName,
        birthDate,
        ignoreId = null
) => {
        return bookingPassengers.some((bp) => {
                if (bp.booking_id !== bookingId || bp.id === ignoreId) return false;
                const p = passengers.find((pass) => pass.id === bp.passenger_id);
                return (
                        p &&
                        p.first_name === firstName &&
                        p.last_name === lastName &&
                        p.birth_date === birthDate
                );
        });
};

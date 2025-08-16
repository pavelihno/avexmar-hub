import { isValid } from 'date-fns';

import { parseDate, parseTime } from './format';

export const validateDate = (value) => {
	if (!value) return false;
	try {
		const date = parseDate(value);
		return isValid(date);
	} catch (error) {
		return false;
	}
};

export const validateTime = (value) => {
	if (!value) return false;
	try {
		const time = parseTime(value);
		return isValid(time);
	} catch (error) {
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

export const isCyrillicText = (value) => {
	if (!value) return false;
	return /^[А-ЯЁа-яё\s-]+$/.test(value);
};

export const isLatinText = (value) => {
	if (!value) return false;
	return /^[A-Za-z\s-]+$/.test(value);
};

import { isValid } from 'date-fns';

import { parseDate, parseTime } from './format';
import zxcvbn from 'zxcvbn';
import { PASSWORD_STRENGTH } from '../../constants';

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

const translateFeedback = (feedback) => {
	if (!feedback) return PASSWORD_STRENGTH.DEFAULT_SUGGESTIONS;

	const messages = [];

	if (feedback.warning) {
		const warning = PASSWORD_STRENGTH.WARNING_MAP[feedback.warning];
		if (warning) messages.push(warning);
	}

	(feedback.suggestions || []).forEach((phrase) => {
		const suggestion = PASSWORD_STRENGTH.SUGGESTION_MAP[phrase];
		if (suggestion) messages.push(suggestion);
	});

	if (!messages.length) {
		return PASSWORD_STRENGTH.DEFAULT_SUGGESTIONS;
	}

	return Array.from(new Set(messages));
};

export const evaluatePasswordStrength = (value) => {
	const password = typeof value === 'string' ? value : '';
	const trimmed = password.trim();

	if (!trimmed.length) {
		return {
			score: 0,
			label: PASSWORD_STRENGTH.LEVEL_LABELS[0],
			levelIndex: 0,
			progress: 0,
			isAcceptable: false,
			suggestions: PASSWORD_STRENGTH.DEFAULT_SUGGESTIONS,
		};
	}

	const result = zxcvbn(trimmed);
	const rawScore = result?.score ?? 0;
	const maxIndex = PASSWORD_STRENGTH.LEVEL_LABELS.length - 1;
	const score = Math.max(0, Math.min(rawScore, maxIndex));
	const label = PASSWORD_STRENGTH.LEVEL_LABELS[score] ?? PASSWORD_STRENGTH.LEVEL_LABELS[0];

	return {
		score,
		label,
		levelIndex: score,
		progress: score / Math.max(1, maxIndex),
		isAcceptable: score >= PASSWORD_STRENGTH.ACCEPTABLE_SCORE,
		suggestions: translateFeedback(result?.feedback),
	};
};

export const isPasswordStrong = (value) => evaluatePasswordStrength(value).isAcceptable;

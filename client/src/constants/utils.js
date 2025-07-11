import { ENUM_LABELS } from './enumLabels';

export const getEnumOptions = (enumType) => {
	return Object.entries(ENUM_LABELS[enumType]).map(([value, label]) => ({
		value,
		label,
	}));
};

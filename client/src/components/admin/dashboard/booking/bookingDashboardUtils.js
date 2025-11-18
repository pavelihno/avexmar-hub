import { ENUM_LABELS } from '../../../../constants';

export const getRouteLabel = (route) => {
	if (!route) return '—';
	if (route.label) return route.label;
	const origin =
		route.origin_airport?.city_name || route.origin_airport?.name || route.origin?.city || route.origin || null;
	const destination =
		route.destination_airport?.city_name ||
		route.destination_airport?.name ||
		route.destination?.city ||
		route.destination ||
		null;

	const parts = [origin, destination].filter(Boolean);
	return parts.length ? parts.join(' — ') : '—';
};

export const getPassengerFullName = (passenger = {}) =>
	[passenger.last_name, passenger.first_name, passenger.patronymic_name].filter(Boolean).join(' ');

export const getPassengerDocumentLabel = (passenger = {}) => {
	const documentTypeLabel = passenger.document_type
		? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
		: null;
	return [documentTypeLabel, passenger.document_number].filter(Boolean).join(' · ');
};

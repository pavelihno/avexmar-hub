import { DATE_API_FORMAT } from '../../constants';
import { formatDate, parseDate } from './format';
import { disabledPassengerChange } from './passengerCategories';

export const hasAvailableSeats = (tariff, totalSeats) => {
	if (!tariff || tariff.seats_left === undefined) return true;
	return tariff.seats_left >= totalSeats;
};

export const handlePassengerChange = (setPassengers, key, delta) => {
	setPassengers((prev) => {
		if (disabledPassengerChange(prev, key, delta)) {
			return prev;
		}
		return {
			...prev,
			[key]: prev[key] + delta,
		};
	});
};

export const getExistingPassenger = (passengers, passengerData) => {
	return passengers.find(
		(p) =>
			p.first_name === passengerData.first_name &&
			p.last_name === passengerData.last_name &&
			p.birth_date === formatDate(passengerData.birth_date, DATE_API_FORMAT) &&
			p.document_type === passengerData.document_type &&
			p.document_number === passengerData.document_number
	);
};

export const findBookingPassengerDuplicates = (passengers) => {
	const duplicates = [];

	for (let i = 0; i < passengers.length; i++) {
		const p1 = passengers[i] || {};
		for (let j = i + 1; j < passengers.length; j++) {
			const p2 = passengers[j] || {};

			const same =
				p1.lastName === p2.lastName &&
				p1.firstName === p2.firstName &&
				p1.patronymicName === p2.patronymicName &&
				p1.gender === p2.gender &&
				formatDate(p1.birthDate) === formatDate(p2.birthDate) &&
				p1.documentType === p2.documentType &&
				p1.documentNumber === p2.documentNumber;

			if (same) {
				duplicates.push([i, j]);
			}
		}
	}

	return duplicates;
};

export const isCyrillicDocument = (documentType) => {
	return ['passport', 'birth_certificate'].includes(documentType);
};

export const getPassengerFormConfig = (documentType) => {
	let show = ['lastName', 'firstName', 'patronymicName', 'gender', 'birthDate', 'documentType', 'documentNumber'];
	let required = ['lastName', 'firstName', 'gender', 'birthDate', 'documentType', 'documentNumber'];

	switch (documentType) {
		case 'passport':
		case 'birth_certificate':
			break;
		case 'foreign_passport':
			show = [...show, 'documentExpiryDate', 'citizenshipId'];
			required = [...required, 'citizenshipId'];
			break;
		case 'international_passport':
			show = [...show, 'documentExpiryDate'];
			required = [...required, 'documentExpiryDate'];
			break;
	}

	return { show, required };
};

export const extractRouteInfo = (flight) => {
	if (!flight || !flight.route) return {};
	const origin = flight.route.origin_airport;
	const destination = flight.route.destination_airport;
	return { from: origin.iata_code, to: destination.iata_code, date: parseDate(flight.scheduled_departure) };
};

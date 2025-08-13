import { MAX_PASSENGERS, DATE_API_FORMAT, VALIDATION_MESSAGES } from '../../constants';
import { differenceInYears } from 'date-fns';
import { formatDate } from '../utils';

export const getTotalPassengers = (passengers) => {
	return (
		(passengers.adults || 0) +
		(passengers.children || 0) +
		(passengers.infants || 0) +
		(passengers.infants_seat || 0)
	);
};

export const getSeatsNumber = (passengers) => {
	return (passengers.adults || 0) + (passengers.children || 0) + (passengers.infants_seat || 0);
};

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

export const disabledPassengerChange = (passengers, key, delta) => {
	const nextValue = passengers[key] + delta;
	const minValue = key === 'adults' ? 1 : 0;

	// 1) no negatives (and at least one adult)
	if (nextValue < minValue) {
		return true;
	}

	// 2) overall max passengers
	const newTotal = getTotalPassengers(passengers) + delta;
	if (newTotal > MAX_PASSENGERS) {
		return true;
	}

	// 3) infants without seat must never exceed adult count
	if (key === 'infants') {
		// when adding an infant
		if (delta === 1 && nextValue > passengers.adults) {
			return true;
		}
	}

	// prevent removing an adult if that would leave more infants than adults
	if (key === 'adults' && delta === -1) {
		const nextAdults = nextValue;
		if (passengers.infants > nextAdults) {
			return true;
		}
	}

	return false;
};

export const getAgeError = (passengerCategory, birthDate, flightDate) => {
	if (!birthDate) return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
	const age = differenceInYears(new Date(flightDate), new Date(birthDate));
	if (passengerCategory === 'adult' && age < 12) return VALIDATION_MESSAGES.PASSENGER.birth_date.ADULT;
	if (passengerCategory === 'child' && (age < 2 || age > 12)) return VALIDATION_MESSAGES.PASSENGER.birth_date.CHILD;
	if (['infant', 'infant_seat'].includes(passengerCategory) && age >= 2)
		return VALIDATION_MESSAGES.PASSENGER.birth_date.INFANT;
	return '';
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
	return { from: origin.iata_code, to: destination.iata_code, date: new Date(flight.scheduled_departure) };
};

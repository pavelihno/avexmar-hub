import { MAX_PASSENGERS } from '../../constants';

export const getFlightDurationMinutes = (flight) => {
	if (!flight) return 0;
	try {
		const depart = new Date(`${flight.scheduled_departure}T${flight.scheduled_departure_time || '00:00:00'}`);
		const arrive = new Date(`${flight.scheduled_arrival}T${flight.scheduled_arrival_time || '00:00:00'}`);
		return Math.round((arrive - depart) / 60000);
	} catch (e) {
		console.error('Failed to calculate duration', e);
		return 0;
	}
};

export const getTotalTicketPrice = (
	outboundFlight,
	returnFlight = null,
	passengers = {},
	tariffs = [],
	discounts = []
) => {
	// Consider extra fees/taxes
	return 0;
};

export const getTotalPassengers = (passengers) => {
	return Object.values(passengers).reduce((total, count) => {
		return total + count;
	}, 0);
};

export const getTotalSeats = (passengers) => {
        return Object.entries(passengers).reduce((total, [key, count]) => {
                if (key === 'infants') return total;
                return total + count;
        }, 0);
};

export const calculateOccupiedSeats = (passengers = {}) => {
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
			passenger.birth_date === formatDate(birthDate, DATE_API_FORMAT)
		);
	});
};

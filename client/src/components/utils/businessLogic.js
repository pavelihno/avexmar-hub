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

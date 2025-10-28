import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchBookingFlights,
	fetchOne: fetchBookingFlight,
	create: createBookingFlight,
	update: updateBookingFlight,
	remove: deleteBookingFlight,
	removeAll: deleteAllBookingFlights,
	removeFiltered: deleteFilteredBookingFlights,
} = createCrudActions('booking_flights');

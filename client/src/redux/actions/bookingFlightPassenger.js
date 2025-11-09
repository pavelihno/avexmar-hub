import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchBookingFlightPassengers,
	fetchOne: fetchBookingFlightPassenger,
	create: createBookingFlightPassenger,
	update: updateBookingFlightPassenger,
	remove: deleteBookingFlightPassenger,
	removeAll: deleteAllBookingFlightPassengers,
	removeFiltered: deleteFilteredBookingFlightPassengers,
} = createCrudActions('booking_flight_passengers');

import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchBookings,
	fetchOne: fetchBooking,
	create: createBooking,
	update: updateBooking,
	remove: deleteBooking,
	removeAll: deleteAllBookings,
} = createCrudActions('bookings');

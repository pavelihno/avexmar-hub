import { createCrudActions } from '../utils';

const {
	fetchAll: fetchBookings,
	fetchOne: fetchBooking,
	create: createBooking,
	update: updateBooking,
	remove: deleteBooking,
} = createCrudActions('bookings');

export {
	fetchBookings,
	fetchBooking,
	createBooking,
	updateBooking,
	deleteBooking,
};

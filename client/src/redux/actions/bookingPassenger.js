import { createCrudActions } from '../utils';

export const {
        fetchAll: fetchBookingPassengers,
        fetchOne: fetchBookingPassenger,
        create: createBookingPassenger,
        update: updateBookingPassenger,
        remove: deleteBookingPassenger,
        removeAll: deleteAllBookingPassengers,
} = createCrudActions('booking_passengers');

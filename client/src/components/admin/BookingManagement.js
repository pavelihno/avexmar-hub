import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchBookings, createBooking, updateBooking, deleteBooking } from '../../redux/actions/booking';
import { FIELD_TYPES, createAdminManager } from './utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const BookingManagement = () => {
	const dispatch = useDispatch();
	const { bookings, isLoading, errors } = useSelector((state) => state.bookings);

	useEffect(() => {
		dispatch(fetchBookings());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		bookingNumber: {
			key: 'bookingNumber',
			apiKey: 'booking_number',
			label: FIELD_LABELS.BOOKING.booking_number,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
		},
		status: {
			key: 'status',
			apiKey: 'status',
			label: FIELD_LABELS.BOOKING.status,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('BOOKING_STATUS'),
			formatter: (value) => ENUM_LABELS.BOOKING_STATUS[value] || value,
		},
		emailAddress: {
			key: 'emailAddress',
			apiKey: 'email_address',
			label: FIELD_LABELS.BOOKING.email_address,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.BOOKING.email_address.REQUIRED : null),
		},
		phoneNumber: {
			key: 'phoneNumber',
			apiKey: 'phone_number',
			label: FIELD_LABELS.BOOKING.phone_number,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED : null),
		},
		firstName: {
			key: 'firstName',
			apiKey: 'first_name',
			label: FIELD_LABELS.BOOKING.first_name,
			type: FIELD_TYPES.TEXT,
		},
		lastName: {
			key: 'lastName',
			apiKey: 'last_name',
			label: FIELD_LABELS.BOOKING.last_name,
			type: FIELD_TYPES.TEXT,
		},
		currency: {
			key: 'currency',
			apiKey: 'currency',
			label: FIELD_LABELS.BOOKING.currency,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('CURRENCY'),
			formatter: (value) => ENUM_LABELS.CURRENCY[value] || value,
		},
		basePrice: {
			key: 'basePrice',
			apiKey: 'base_price',
			label: FIELD_LABELS.BOOKING.base_price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
		},
		finalPrice: {
			key: 'finalPrice',
			apiKey: 'final_price',
			label: FIELD_LABELS.BOOKING.final_price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: UI_LABELS.ADMIN.modules.bookings.add_button,
		editButtonText: UI_LABELS.ADMIN.modules.bookings.edit_button,
	});

	const handleAddBooking = (data) => {
		return dispatch(createBooking(adminManager.toApiFormat(data))).unwrap();
	};

	const handleEditBooking = (data) => {
		return dispatch(updateBooking(adminManager.toApiFormat(data))).unwrap();
	};

	const handleDeleteBooking = (id) => {
		return dispatch(deleteBooking(id));
	};

	const formattedBookings = bookings.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.bookings.management}
			data={formattedBookings}
			columns={adminManager.columns}
			onAdd={handleAddBooking}
			onEdit={handleEditBooking}
			onDelete={handleDeleteBooking}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.bookings.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default BookingManagement;

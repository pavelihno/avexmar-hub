import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';

import {
	fetchBookings,
	createBooking,
	updateBooking,
	deleteBooking,
	deleteAllBookings,
	deleteFilteredBookings,
} from '../../../redux/actions/booking';
import { fetchUsers } from '../../../redux/actions/user';
import { createAdminManager } from '../utils';
import { FIELD_TYPES } from '../../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, getEnumOptions } from '../../../constants';
import { formatDate, formatTime } from '../../utils';

const BookingManagement = () => {
	const dispatch = useDispatch();
	const { bookings, isLoading, errors } = useSelector((state) => state.bookings);
	const { users, isLoading: usersLoading } = useSelector((state) => state.users);

	useEffect(() => {
		dispatch(fetchBookings());
		dispatch(fetchUsers());
	}, [dispatch]);

	const currencyOptions = getEnumOptions('CURRENCY');
	const userOptions = users.map((u) => ({
		value: u.id,
		label: `${u.email}`,
	}));

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		publicId: {
			key: 'publicId',
			apiKey: 'public_id',
			label: FIELD_LABELS.BOOKING.public_id,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
		bookingNumber: {
			key: 'bookingNumber',
			apiKey: 'booking_number',
			label: FIELD_LABELS.BOOKING.booking_number,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
		bookingDate: {
			key: 'bookingDate',
			apiKey: 'booking_date',
			label: FIELD_LABELS.BOOKING.booking_date,
			type: FIELD_TYPES.DATE,
			excludeFromForm: true,
			formatter: (value) => formatDate(value),
		},
		status: {
			key: 'status',
			apiKey: 'status',
			label: FIELD_LABELS.BOOKING.status,
			type: FIELD_TYPES.SELECT,
			excludeFromForm: true,
			options: getEnumOptions('BOOKING_STATUS'),
			formatter: (value) => ENUM_LABELS.BOOKING_STATUS[value] || value,
		},
		buyerLastName: {
			key: 'buyerLastName',
			apiKey: 'buyer_last_name',
			label: FIELD_LABELS.BOOKING.buyer_last_name,
			type: FIELD_TYPES.TEXT,
		},
		buyerFirstName: {
			key: 'buyerFirstName',
			apiKey: 'buyer_first_name',
			label: FIELD_LABELS.BOOKING.buyer_first_name,
			type: FIELD_TYPES.TEXT,
		},
		emailAddress: {
			key: 'emailAddress',
			apiKey: 'email_address',
			label: FIELD_LABELS.BOOKING.email_address,
			type: FIELD_TYPES.EMAIL,
		},
		phoneNumber: {
			key: 'phoneNumber',
			apiKey: 'phone_number',
			label: FIELD_LABELS.BOOKING.phone_number,
			type: FIELD_TYPES.PHONE,
		},
		farePrice: {
			key: 'farePrice',
			apiKey: 'fare_price',
			label: FIELD_LABELS.BOOKING.fare_price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
			excludeFromTable: true,
		},
		totalDiscounts: {
			key: 'totalDiscounts',
			apiKey: 'total_discounts',
			label: FIELD_LABELS.BOOKING.total_discounts,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
			excludeFromTable: true,
		},
		fees: {
			key: 'fees',
			apiKey: 'fees',
			label: FIELD_LABELS.BOOKING.fees,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
			excludeFromTable: true,
		},
		totalPrice: {
			key: 'totalPrice',
			apiKey: 'total_price',
			label: FIELD_LABELS.BOOKING.total_price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
			excludeFromTable: true,
		},
		currency: {
			key: 'currency',
			apiKey: 'currency',
			label: FIELD_LABELS.BOOKING.currency,
			type: FIELD_TYPES.SELECT,
			options: currencyOptions,
			defaultValue: currencyOptions[0].value,
			excludeFromTable: true,
			formatter: (value) => ENUM_LABELS.CURRENCY[value] || value,
		},
		userId: {
			key: 'userId',
			apiKey: 'user_id',
			label: FIELD_LABELS.BOOKING.user_id,
			type: FIELD_TYPES.SELECT,
			options: userOptions,
			excludeFromTable: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.bookings.add_button,
		editButtonText: (item) => {
			if (!item) return UI_LABELS.ADMIN.modules.bookings.edit_button;
			else {
				const bookingNumber = item[FIELDS.bookingNumber.key] || '';
				const publicId = item[FIELDS.publicId.key];
				const bookingDate = item[FIELDS.bookingDate.key] ? formatDate(item[FIELDS.bookingDate.key]) : '';

				return `${UI_LABELS.ADMIN.modules.bookings.edit_button} ${
					bookingNumber ? `№ ${bookingNumber}` : ''
				} — ${publicId} — ${bookingDate}`;
			}
		},
	});

	const handleAddBooking = async (data) => {
		const created = await dispatch(createBooking(adminManager.toApiFormat(data))).unwrap();
		return created;
	};

	const handleEditBooking = async (data) => {
		const { id, ...bookingData } = data;
		const updated = await dispatch(updateBooking(adminManager.toApiFormat({ id, ...bookingData }))).unwrap();
		return updated;
	};

	const handleDeleteBooking = (id) => dispatch(deleteBooking(id)).unwrap();

	const handleDeleteAllBookings = async () => {
		await dispatch(deleteAllBookings()).unwrap();
		dispatch(fetchBookings());
	};
	const handleDeleteFilteredBookings = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredBookings(ids)).unwrap();
		dispatch(fetchBookings());
	};

	const formattedBookings = bookings.map((b) => adminManager.toUiFormat(b));

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.bookings.management}
			data={formattedBookings}
			columns={adminManager.columns}
			onAdd={handleAddBooking}
			onEdit={handleEditBooking}
			onDelete={handleDeleteBooking}
			onDeleteAll={handleDeleteAllBookings}
			onDeleteFiltered={handleDeleteFilteredBookings}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.bookings.add_button}
			isLoading={isLoading || usersLoading}
			error={errors}
		/>
	);
};

export default BookingManagement;

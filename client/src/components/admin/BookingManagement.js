import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchBookings,
	createBooking,
	updateBooking,
	deleteBooking,
	deleteAllBookings,
} from '../../redux/actions/booking';
import { fetchBookingPassengers } from '../../redux/actions/bookingPassenger';
import { fetchPassengers } from '../../redux/actions/passenger';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';
import { formatDate, validateEmail, validatePhoneNumber } from '../utils';

const BookingManagement = () => {
	const dispatch = useDispatch();
	const { bookings, isLoading, errors } = useSelector((state) => state.bookings);
	const { bookingPassengers, isLoading: bookingPassengersLoading } = useSelector((state) => state.bookingPassengers);
	const { passengers, isLoading: passengersLoading } = useSelector((state) => state.passengers);

	useEffect(() => {
		dispatch(fetchBookings());
		dispatch(fetchBookingPassengers());
		dispatch(fetchPassengers());
	}, [dispatch]);

	const currencyOptions = useMemo(() => getEnumOptions('CURRENCY'), []);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
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
		emailAddress: {
			key: 'emailAddress',
			apiKey: 'email_address',
			label: FIELD_LABELS.BOOKING.email_address,
			type: FIELD_TYPES.EMAIL,
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.BOOKING.email_address.REQUIRED;
				if (!validateEmail(value)) return VALIDATION_MESSAGES.BOOKING.email_address.INVALID;
				return null;
			},
		},
		phoneNumber: {
			key: 'phoneNumber',
			apiKey: 'phone_number',
			label: FIELD_LABELS.BOOKING.phone_number,
			type: FIELD_TYPES.PHONE,
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED;
				if (!validatePhoneNumber(value)) return VALIDATION_MESSAGES.BOOKING.phone_number.INVALID;
				return null;
			},
		},
		basePrice: {
			key: 'basePrice',
			apiKey: 'base_price',
			label: FIELD_LABELS.BOOKING.base_price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: { min: 0, step: 0.01 },
			excludeFromTable: true,
		},
		finalPrice: {
			key: 'finalPrice',
			apiKey: 'final_price',
			label: FIELD_LABELS.BOOKING.final_price,
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
		passengers: {
			key: 'passengers',
			apiKey: 'passengers',
			label: FIELD_LABELS.BOOKING.passengers,
			type: FIELD_TYPES.CUSTOM,
			excludeFromForm: true,
			renderField: (item) => {
				const bps = bookingPassengers.filter((bp) => bp.booking_id === item.id);
				const linked = bps.map((bp) => passengers.find((p) => p.id === bp.passenger_id)).filter(Boolean);
				return (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							minWidth: '200px',
						}}
					>
						{linked.map((p) => {
							const passengerLabel = `${p.last_name} ${p.first_name} ${formatDate(p.birth_date)}`;
							return (
								<Box
									key={p.id}
									sx={{
										display: 'flex',
										alignItems: 'center',
										mb: 0.5,
										backgroundColor: 'rgba(0,0,0,0.04)',
										borderRadius: 1,
										p: 0.5,
										width: 'auto',
									}}
								>
									<Typography
										variant='body2'
										sx={{
											mr: 1,
											flexGrow: 1,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
										}}
									>
										{passengerLabel}
									</Typography>
								</Box>
							);
						})}
					</Box>
				);
			},
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.bookings.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.bookings.edit_button,
	});

	const handleAddBooking = (data) => dispatch(createBooking(adminManager.toApiFormat(data))).unwrap();
	const handleEditBooking = (data) => dispatch(updateBooking(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteBooking = (id) => dispatch(deleteBooking(id)).unwrap();

	const handleDeleteAllBookings = async () => {
		await dispatch(deleteAllBookings()).unwrap();
		dispatch(fetchBookings());
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
			onDeleteAll={handleDeleteAllBookings}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.bookings.add_button}
			isLoading={isLoading || bookingPassengersLoading || passengersLoading}
			error={errors}
		/>
	);
};

export default BookingManagement;

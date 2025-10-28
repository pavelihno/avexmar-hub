import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchBookings,
	createBooking,
	updateBooking,
	deleteBooking,
	deleteAllBookings,
	deleteFilteredBookings,
} from '../../redux/actions/booking';
import {
	fetchBookingPassengers,
	createBookingPassenger,
	deleteBookingPassenger,
} from '../../redux/actions/bookingPassenger';
import { fetchBookingFlights } from '../../redux/actions/bookingFlight';
import { fetchUsers } from '../../redux/actions/user';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, getEnumOptions } from '../../constants';
import { formatDate, formatTime } from '../utils';

const BookingManagement = () => {
	const dispatch = useDispatch();
	const { bookings, isLoading, errors } = useSelector((state) => state.bookings);
	const { bookingPassengers, isLoading: bookingPassengersLoading } = useSelector((state) => state.bookingPassengers);
	const { bookingFlights, isLoading: bookingFlightsLoading } = useSelector((state) => state.bookingFlights);
	const { users, isLoading: usersLoading } = useSelector((state) => state.users);

	const theme = useTheme();

	useEffect(() => {
		dispatch(fetchBookings());
		dispatch(fetchBookingPassengers());
		dispatch(fetchBookingFlights());
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
			excludeFromTable: true,
		},
		buyerFirstName: {
			key: 'buyerFirstName',
			apiKey: 'buyer_first_name',
			label: FIELD_LABELS.BOOKING.buyer_first_name,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
		},
		emailAddress: {
			key: 'emailAddress',
			apiKey: 'email_address',
			label: FIELD_LABELS.BOOKING.email_address,
			type: FIELD_TYPES.EMAIL,
			excludeFromTable: true,
		},
		phoneNumber: {
			key: 'phoneNumber',
			apiKey: 'phone_number',
			label: FIELD_LABELS.BOOKING.phone_number,
			type: FIELD_TYPES.PHONE,
			excludeFromTable: true,
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
		passengers: {
			key: 'passengers',
			apiKey: 'passengers',
			label: FIELD_LABELS.BOOKING.passengers,
			type: FIELD_TYPES.CUSTOM,
			excludeFromForm: true,
			renderField: (item) => {
				const bps = bookingPassengers.filter((bp) => bp.booking_id === item.id);
				const linked = bps
					.map((bp) => {
						const passenger = bp.passenger;
						if (!passenger || Object.keys(passenger).length === 0) return null;
						return passenger;
					})
					.filter(Boolean);
				return (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							minWidth: { xs: 0, md: '200px' },
							width: { xs: '100%', md: 'auto' },
							maxWidth: '100%',
						}}
					>
						{linked.map((p) => {
							const birthDate = p.birth_date ? formatDate(p.birth_date) : '';
							const passengerLabel = `${p.last_name ?? ''} ${p.first_name ?? ''} ${birthDate}`.trim();
							return (
								<Box
									key={p.id}
									sx={{
										display: 'flex',
										alignItems: 'center',
										mb: 0.5,
										backgroundColor: alpha(theme.palette.black, 0.04),
										borderRadius: 1,
										p: 0.5,
										width: '100%',
										maxWidth: '100%',
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
		flights: {
			key: 'flights',
			apiKey: 'flights',
			label: FIELD_LABELS.BOOKING.flights,
			type: FIELD_TYPES.CUSTOM,
			excludeFromForm: true,
			renderField: (item) => {
				const bfs = bookingFlights.filter((bf) => bf.booking_id === item.id);
				const linked = bfs
					.map((bf) => {
						const flight = bf.flight;
						if (!flight || Object.keys(flight).length === 0) return null;
						return flight;
					})
					.filter(Boolean);
				return (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							minWidth: { xs: 0, md: '200px' },
							width: { xs: '100%', md: 'auto' },
							maxWidth: '100%',
						}}
					>
						{linked.map((flight) => {
							const flightNumber = flight.airline_flight_number || flight.flight_number || '';
							const route = flight.route || {};
							const origin = route.origin_airport?.iata_code;
							const destination = route.destination_airport?.iata_code;
							const routeLabel =
								origin && destination ? `${origin} → ${destination}` : origin || destination || '';
							const departureLabel = [
								flight.scheduled_departure ? formatDate(flight.scheduled_departure) : '',
								flight.scheduled_departure_time ? formatTime(flight.scheduled_departure_time) : '',
							]
								.filter(Boolean)
								.join(' ');
							const arrivalLabel = [
								flight.scheduled_arrival ? formatDate(flight.scheduled_arrival) : '',
								flight.scheduled_arrival_time ? formatTime(flight.scheduled_arrival_time) : '',
							]
								.filter(Boolean)
								.join(' ');
							const timeline = [departureLabel, arrivalLabel].filter(Boolean).join(' → ');

							return (
								<Box
									key={flight.id}
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-start',
										mb: 0.5,
										backgroundColor: alpha(theme.palette.black, 0.04),
										borderRadius: 1,
										p: 0.5,
										width: '100%',
										maxWidth: '100%',
									}}
								>
									<Typography
										variant='body2'
										sx={{
											fontWeight: 500,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											width: '100%',
										}}
									>
										{[flightNumber, routeLabel].filter(Boolean).join(' — ') || '—'}
									</Typography>
									{timeline && (
										<Typography
											variant='caption'
											color='text.secondary'
											sx={{
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												width: '100%',
											}}
										>
											{timeline}
										</Typography>
									)}
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
		const { passengerIds = [], ...bookingData } = data;
		const created = await dispatch(createBooking(adminManager.toApiFormat(bookingData))).unwrap();
		await Promise.all(
			passengerIds.map((pid) =>
				dispatch(
					createBookingPassenger({
						booking_id: created.id,
						passenger_id: pid,
					})
				).unwrap()
			)
		);
		return created;
	};

	const handleEditBooking = async (data) => {
		const { passengerIds = [], id, ...bookingData } = data;
		const updated = await dispatch(updateBooking(adminManager.toApiFormat({ id, ...bookingData }))).unwrap();

		const existingBps = bookingPassengers.filter((bp) => bp.booking_id === id);
		const existingIds = existingBps.map((bp) => bp.passenger_id);
		const toAdd = passengerIds.filter((pid) => !existingIds.includes(pid));
		const toRemove = existingIds.filter((pid) => !passengerIds.includes(pid));

		await Promise.all(
			toAdd.map((pid) =>
				dispatch(
					createBookingPassenger({
						booking_id: id,
						passenger_id: pid,
					})
				).unwrap()
			)
		);

		await Promise.all(
			toRemove.map((pid) => {
				const bp = existingBps.find((b) => b.passenger_id === pid);
				return bp ? dispatch(deleteBookingPassenger(bp.id)).unwrap() : Promise.resolve();
			})
		);

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

	const formattedBookings = bookings.map((b) => {
		const ui = adminManager.toUiFormat(b);
		const bps = bookingPassengers.filter((bp) => bp.booking_id === b.id);
		const bfs = bookingFlights.filter((bf) => bf.booking_id === b.id);
		ui.passengerIds = bps.map((bp) => bp.passenger_id);
		ui.flightIds = bfs.map((bf) => bf.flight_id);
		return ui;
	});

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
			isLoading={isLoading || bookingPassengersLoading || bookingFlightsLoading || usersLoading}
			error={errors}
		/>
	);
};

export default BookingManagement;

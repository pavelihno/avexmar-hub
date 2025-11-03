import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';

import {
	fetchTickets,
	createTicket,
	updateTicket,
	deleteTicket,
	deleteAllTickets,
	deleteFilteredTickets,
} from '../../../redux/actions/ticket';
import { fetchFlights } from '../../../redux/actions/flight';
import { fetchBookings } from '../../../redux/actions/booking';
import { fetchPassengers } from '../../../redux/actions/passenger';
import { createAdminManager } from '../utils';
import { FIELD_TYPES, formatDate } from '../../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../../constants';

const TicketManagement = () => {
	const dispatch = useDispatch();
	const { tickets: ticketsData = [], isLoading, errors } = useSelector((state) => state.tickets);
	const { flights: flightsData = [] } = useSelector((state) => state.flights);
	const { bookings: bookingsData = [] } = useSelector((state) => state.bookings);
	const { passengers: passengersData = [] } = useSelector((state) => state.passengers);

	useEffect(() => {
		dispatch(fetchTickets());
		dispatch(fetchFlights());
		dispatch(fetchBookings());
		dispatch(fetchPassengers());
	}, [dispatch]);

	const tickets = Array.isArray(ticketsData) ? ticketsData : [];
	const flights = Array.isArray(flightsData) ? flightsData : [];
	const bookings = Array.isArray(bookingsData) ? bookingsData : [];
	const passengers = Array.isArray(passengersData) ? passengersData : [];
	const addPlaceholderOption = (options) => [{ value: '', label: '—' }, ...options];

	const getOptionLabel = (options, value) => {
		if (value === null || value === undefined || value === '') return '—';
		const option = options.find((o) => o.value === value);
		return option ? option.label : value;
	};

	const formatBookingLabel = (booking) => {
		if (!booking) return '—';
		const bookingIdLabel = booking.booking_number || booking.public_id || booking.id;
		const bookingDateLabel = formatDate(booking.booking_date);
		return [bookingIdLabel, bookingDateLabel].filter(Boolean).join(' — ') || String(booking.id);
	};

	const formatPassengerLabel = (passenger) => {
		if (!passenger) return '—';
		const fullName = [passenger.last_name, passenger.first_name, passenger.patronymic_name]
			.filter(Boolean)
			.join(' ');
		const document = passenger.document_number ? ` (${passenger.document_number})` : '';
		const label = `${fullName}${document}`.trim();
		return label || String(passenger.id);
	};

	const flightOptions = flights.map((flight) => {
		const flightNumber = flight.airline_flight_number || '';
		const flightDate = flight.scheduled_departure ? formatDate(flight.scheduled_departure) : '';
		return {
			value: flight.id,
			label: [flightNumber, flightDate].filter(Boolean).join(' — ') || String(flight.id),
		};
	});

	const baseBookingOptions = bookings.map((booking) => ({
		value: booking.id,
		label: formatBookingLabel(booking),
	}));

	const basePassengerOptions = passengers.map((passenger) => ({
		value: passenger.id,
		label: formatPassengerLabel(passenger),
	}));

	const bookingOptions = addPlaceholderOption(baseBookingOptions);
	const passengerOptions = addPlaceholderOption(basePassengerOptions);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		ticketNumber: {
			key: 'ticketNumber',
			apiKey: 'ticket_number',
			label: FIELD_LABELS.TICKET.ticket_number,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.ticket_number.REQUIRED : null),
		},
		flightId: {
			key: 'flightId',
			apiKey: 'flight_id',
			label: FIELD_LABELS.TICKET.flight_id,
			type: FIELD_TYPES.SELECT,
			options: flightOptions,
			formatter: (value) => getOptionLabel(flightOptions, value),
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.flight_id.REQUIRED : null),
		},
		bookingId: {
			key: 'bookingId',
			apiKey: 'booking_id',
			label: FIELD_LABELS.TICKET.booking_id,
			type: FIELD_TYPES.SELECT,
			options: bookingOptions,
			formatter: (value) => getOptionLabel(baseBookingOptions, value),
			toApi: (value) => (value ? value : null),
			toUi: (value) => value ?? '',
			excludeFromTable: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.booking_id.REQUIRED : null),
		},
		bookingNumber: {
			key: 'bookingNumber',
			label: FIELD_LABELS.BOOKING.booking_number,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
		passengerId: {
			key: 'passengerId',
			apiKey: 'passenger_id',
			label: FIELD_LABELS.TICKET.passenger_id,
			type: FIELD_TYPES.SELECT,
			options: passengerOptions,
			formatter: (value) => getOptionLabel(basePassengerOptions, value),
			toApi: (value) => (value ? value : null),
			toUi: (value) => value ?? '',
			excludeFromTable: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.passenger_id.REQUIRED : null),
		},
		passengerName: {
			key: 'passengerName',
			label: FIELD_LABELS.TICKET.passenger_id,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.tickets.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.tickets.edit_button,
	});

	const handleAddTicket = (data) => dispatch(createTicket(adminManager.toApiFormat(data))).unwrap();
	const handleEditTicket = (data) => dispatch(updateTicket(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteTicket = (id) => dispatch(deleteTicket(id)).unwrap();

	const handleDeleteAllTickets = async () => {
		await dispatch(deleteAllTickets()).unwrap();
		dispatch(fetchTickets());
	};

	const handleDeleteFilteredTickets = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredTickets(ids)).unwrap();
		dispatch(fetchTickets());
	};

	const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
	const passengerById = new Map(passengers.map((passenger) => [passenger.id, passenger]));

	const formattedTickets = tickets.map((ticket) => {
		const formatted = adminManager.toUiFormat(ticket);

		const bookingIdFromTicket = ticket.booking_id;
		const passengerIdFromTicket = ticket.passenger_id;

		const booking = bookingById.get(bookingIdFromTicket);
		formatted.bookingNumber = formatBookingLabel(booking);
		formatted.bookingId = bookingIdFromTicket ?? '';

		const passenger = passengerById.get(passengerIdFromTicket);
		formatted.passengerName = formatPassengerLabel(passenger);
		formatted.passengerId = passengerIdFromTicket ?? '';

		return formatted;
	});

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.tickets.management}
			data={formattedTickets}
			columns={adminManager.columns}
			onAdd={handleAddTicket}
			onEdit={handleEditTicket}
			onDelete={handleDeleteTicket}
			onDeleteAll={handleDeleteAllTickets}
			onDeleteFiltered={handleDeleteFilteredTickets}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.tickets.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default TicketManagement;

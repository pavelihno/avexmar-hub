import React, { useEffect, useMemo } from 'react';
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
import { fetchBookingFlightPassengers } from '../../../redux/actions/bookingFlightPassenger';
import { createAdminManager } from '../utils';
import { FIELD_TYPES, formatDate } from '../../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../../constants';

const TicketManagement = () => {
	const dispatch = useDispatch();
	const { tickets: ticketsData = [], isLoading, errors } = useSelector((state) => state.tickets);
	const { bookingFlightPassengers: bookingFlightPassengersData = [] } = useSelector(
		(state) => state.bookingFlightPassengers
	);

	useEffect(() => {
		dispatch(fetchTickets());
		dispatch(fetchBookingFlightPassengers());
	}, [dispatch]);

	const tickets = Array.isArray(ticketsData) ? ticketsData : [];
	const bookingFlightPassengers = Array.isArray(bookingFlightPassengersData) ? bookingFlightPassengersData : [];

	const formatBookingFlightPassengerLabel = (bfp) => {
		if (!bfp) return '—';

		const booking = bfp.booking_passenger?.booking || {};
		const passenger = bfp.booking_passenger?.passenger || {};
		const flight = bfp.flight || {};

		const bookingLabel = booking.booking_number || booking.public_id || `#${booking.id || ''}`;
		const passengerName = [passenger.last_name, passenger.first_name].join(' ');
		const flightNumber = flight.airline_flight_number || '';
		const flightDate = flight.scheduled_departure ? formatDate(flight.scheduled_departure) : '';
		const flightLabel = [flightNumber, flightDate].filter(Boolean).join(' ');

		return [bookingLabel, flightLabel, passengerName].filter(Boolean).join(' • ') || String(bfp.id);
	};

	const bookingFlightPassengerOptions = useMemo(
		() =>
			bookingFlightPassengers
				.map((bfp) => ({
					value: bfp.id,
					label: formatBookingFlightPassengerLabel(bfp),
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[bookingFlightPassengers]
	);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		ticketNumber: {
			key: 'ticketNumber',
			apiKey: 'ticket_number',
			label: FIELD_LABELS.TICKET.ticket_number,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.ticket_number.REQUIRED : null),
		},
		bookingFlightPassengerId: {
			key: 'bookingFlightPassengerId',
			apiKey: 'booking_flight_passenger_id',
			label: FIELD_LABELS.TICKET.booking_flight_passenger_id,
			type: FIELD_TYPES.SELECT,
			fullWidth: true,
			excludeFromTable: true,
			options: bookingFlightPassengerOptions,
			formatter: (value) => {
				if (!value) return '—';
				const bfp = bookingFlightPassengers.find((b) => b.id === value);
				return formatBookingFlightPassengerLabel(bfp);
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.TICKET.booking_flight_passenger_id.REQUIRED : null),
		},
		bookingNumber: {
			key: 'bookingNumber',
			label: FIELD_LABELS.BOOKING.booking_number,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
		passengerName: {
			key: 'passengerName',
			label: FIELD_LABELS.TICKET.passenger_id,
			type: FIELD_TYPES.TEXT,
			excludeFromForm: true,
		},
		flightNumber: {
			key: 'flightNumber',
			label: FIELD_LABELS.TICKET.flight_id,
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

	const bookingFlightPassengerById = useMemo(
		() => new Map(bookingFlightPassengers.map((bfp) => [bfp.id, bfp])),
		[bookingFlightPassengers]
	);

	const formattedTickets = tickets.map((ticket) => {
		const formatted = adminManager.toUiFormat(ticket);

		const bfp = bookingFlightPassengerById.get(ticket.booking_flight_passenger_id);

		if (bfp) {
			const booking = bfp.booking_passenger?.booking || {};
			const passenger = bfp.booking_passenger?.passenger || {};
			const flight = bfp.flight || {};

			formatted.bookingNumber = booking.booking_number || booking.public_id || `#${booking.id || ''}`;

			formatted.passengerName =
				[passenger.last_name, passenger.first_name, passenger.patronymic_name].filter(Boolean).join(' ') || '—';

			const flightNumber = flight.airline_flight_number || '';
			const flightDate = flight.scheduled_departure ? formatDate(flight.scheduled_departure) : '';
			formatted.flightNumber = [flightNumber, flightDate].filter(Boolean).join(' — ') || '—';
		} else {
			formatted.bookingNumber = '—';
			formatted.passengerName = '—';
			formatted.flightNumber = '—';
		}

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

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchTickets, createTicket, updateTicket, deleteTicket, deleteAllTickets } from '../../redux/actions/ticket';
import { fetchFlights } from '../../redux/actions/flight';
import { fetchBookings } from '../../redux/actions/booking';
import { fetchPassengers } from '../../redux/actions/passenger';
import { fetchDiscounts } from '../../redux/actions/discount';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { FIELD_LABELS, UI_LABELS } from '../../constants';

const TicketManagement = () => {
	const dispatch = useDispatch();
	const { tickets, isLoading, errors } = useSelector((state) => state.tickets);
	const { flights, isLoading: flightsLoading } = useSelector((state) => state.flights);
	const { bookings, isLoading: bookingsLoading } = useSelector((state) => state.bookings);
	const { passengers, isLoading: passengersLoading } = useSelector((state) => state.passengers);
	const { discounts, isLoading: discountsLoading } = useSelector((state) => state.discounts);

	useEffect(() => {
		dispatch(fetchTickets());
		dispatch(fetchFlights());
		dispatch(fetchBookings());
		dispatch(fetchPassengers());
		dispatch(fetchDiscounts());
	}, [dispatch]);

	const flightOptions = flights.map((f) => ({ value: f.id, label: f.id }));

	const bookingOptions = bookings.map((b) => ({
		value: b.id,
		label: b.booking_number,
	}));

	const passengerOptions = passengers.map((p) => ({
		value: p.id,
		label: `${p.first_name} ${p.last_name}`,
	}));

	const discountOptions = discounts.map((d) => ({
		value: d.id,
		label: d.discount_name,
	}));

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		ticketNumber: {
			key: 'ticketNumber',
			apiKey: 'ticket_number',
			label: FIELD_LABELS.TICKET.ticket_number,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
		},
		flightId: {
			key: 'flightId',
			apiKey: 'flight_id',
			label: FIELD_LABELS.TICKET.flight_id,
			type: FIELD_TYPES.SELECT,
			options: flightOptions,
		},
		bookingId: {
			key: 'bookingId',
			apiKey: 'booking_id',
			label: FIELD_LABELS.TICKET.booking_id,
			type: FIELD_TYPES.SELECT,
			options: bookingOptions,
		},
		passengerId: {
			key: 'passengerId',
			apiKey: 'passenger_id',
			label: FIELD_LABELS.TICKET.passenger_id,
			type: FIELD_TYPES.SELECT,
			options: passengerOptions,
		},
		discountId: {
			key: 'discountId',
			apiKey: 'discount_id',
			label: FIELD_LABELS.DISCOUNT.discount_name,
			type: FIELD_TYPES.SELECT,
			options: discountOptions,
		},
		seatId: {
			key: 'seatId',
			apiKey: 'seat_id',
			label: 'Seat ID',
			type: FIELD_TYPES.NUMBER,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.tickets.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.tickets.edit_button,
	});

	const handleAddTicket = (data) => dispatch(createTicket(adminManager.toApiFormat(data))).unwrap();
	const handleEditTicket = (data) => dispatch(updateTicket(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteTicket = (id) => dispatch(deleteTicket(id)).unwrap();

	const handleDeleteAllTickets = async () => {
		await dispatch(deleteAllTickets()).unwrap();
		dispatch(fetchTickets());
	};

	const formattedTickets = tickets.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.tickets.management}
			data={formattedTickets}
			columns={adminManager.columns}
			onAdd={handleAddTicket}
			onEdit={handleEditTicket}
			onDelete={handleDeleteTicket}
			onDeleteAll={handleDeleteAllTickets}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.tickets.add_button}
			isLoading={isLoading || flightsLoading || bookingsLoading || passengersLoading || discountsLoading}
			error={errors}
		/>
	);
};

export default TicketManagement;

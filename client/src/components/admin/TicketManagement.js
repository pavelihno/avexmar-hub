import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchTickets, createTicket, updateTicket, deleteTicket, deleteAllTickets } from '../../redux/actions/ticket';
import { fetchFlights } from '../../redux/actions/flight';
import { fetchBookings } from '../../redux/actions/booking';
import { fetchPassengers } from '../../redux/actions/passenger';
import { fetchDiscounts } from '../../redux/actions/discount';
import { FIELD_TYPES, createAdminManager } from './utils';
import { FIELD_LABELS, UI_LABELS } from '../../constants';

const TicketManagement = () => {
	const dispatch = useDispatch();
	const { tickets, isLoading, errors } = useSelector((state) => state.tickets);
	const { flights } = useSelector((state) => state.flights);
	const { bookings } = useSelector((state) => state.bookings);
	const { passengers } = useSelector((state) => state.passengers);
	const { discounts } = useSelector((state) => state.discounts);

	useEffect(() => {
		dispatch(fetchTickets());
		dispatch(fetchFlights());
		dispatch(fetchBookings());
		dispatch(fetchPassengers());
		dispatch(fetchDiscounts());
	}, [dispatch]);

	const flightOptions = useMemo(
		() =>
			flights.map((f) => ({
				value: f.id,
				label: f.id,
			})),
		[flights]
	);

	const bookingOptions = useMemo(
		() =>
			bookings.map((b) => ({
				value: b.id,
				label: b.booking_number,
			})),
		[bookings]
	);

	const passengerOptions = useMemo(
		() =>
			passengers.map((p) => ({
				value: p.id,
				label: `${p.first_name} ${p.last_name}`,
			})),
		[passengers]
	);

	const discountOptions = useMemo(
		() =>
			discounts.map((d) => ({
				value: d.id,
				label: d.discount_name,
			})),
		[discounts]
	);

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
		addButtonText: UI_LABELS.ADMIN.modules.tickets.add_button,
		editButtonText: UI_LABELS.ADMIN.modules.tickets.edit_button,
	});

	const handleAddTicket = (data) => {
		return dispatch(createTicket(adminManager.toApiFormat(data))).unwrap();
	};

	const handleEditTicket = (data) => {
		return dispatch(updateTicket(adminManager.toApiFormat(data))).unwrap();
	};

	const handleDeleteTicket = (id) => {
		return dispatch(deleteTicket(id));
	};

	const handleDeleteAll = async () => {
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
			onDeleteAll={handleDeleteAll}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.tickets.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default TicketManagement;

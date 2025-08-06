import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Tooltip,
	Typography,
	Card,
	CardActionArea,
	IconButton,
	Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { UI_LABELS, ENUM_LABELS, MAX_PASSENGERS, DATE_FORMAT } from '../../constants';
import { formatTime, formatDate, formatNumber, handlePassengerChange, disabledPassengerChange } from '../utils';

const passengerCategories = UI_LABELS.SEARCH.form.passenger_categories;

const buildTariffOptions = (outbound, returnFlight) => {
	const map = {};
	(outbound?.tariffs || []).forEach((t) => {
		map[t.seat_class] = {
			price: t.price,
			currency: t.currency,
			seats_left: t.seats_left,
		};
	});
	if (returnFlight) {
		(returnFlight.tariffs || []).forEach((t) => {
			if (map[t.seat_class]) {
				map[t.seat_class].price += t.price;
				if (t.seats_left !== undefined) {
					const current = map[t.seat_class].seats_left;
					map[t.seat_class].seats_left =
						current !== undefined ? Math.min(current, t.seats_left) : t.seats_left;
				}
			} else {
				map[t.seat_class] = {
					price: t.price,
					currency: t.currency,
					seats_left: t.seats_left,
				};
			}
		});
	}
	return Object.entries(map).map(([seat_class, info]) => ({
		seat_class,
		...info,
	}));
};

const FlightInfo = ({ flight, airlines, airports, routes }) => {
	if (!flight) return null;
	const airline = airlines.find((a) => a.id === flight.airline_id) || {};
	const route = routes.find((r) => r.id === flight.route_id) || {};
	const origin = airports.find((a) => a.id === route.origin_airport_id) || {};
	const dest = airports.find((a) => a.id === route.destination_airport_id) || {};

	return (
		<Box sx={{ mb: 2 }}>
			<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
				{airline.name || airline.id}
			</Typography>
			<Typography variant='body2' color='text.secondary'>
				{origin.name || origin.id} → {dest.name || dest.id}
			</Typography>
			<Typography variant='body2' color='text.secondary'>
				{`${formatDate(flight.scheduled_departure)} ${formatTime(flight.scheduled_departure_time)}`} -{' '}
				{`${formatDate(flight.scheduled_arrival)} ${formatTime(flight.scheduled_arrival_time)}`}
			</Typography>
		</Box>
	);
};

const SelectTicketDialog = ({
	initialParams = {},
	open,
	onClose,
	outbound,
	returnFlight,
	airlines,
	airports,
	routes,
	discounts,
}) => {
	const navigate = useNavigate();

	const tariffOptions = useMemo(() => buildTariffOptions(outbound, returnFlight), [outbound, returnFlight]);

	const [seatClass, setSeatClass] = useState(initialParams.class || tariffOptions[0]?.seat_class);

	const [passengers, setPassengers] = useState({
		adults: parseInt(initialParams.adults) || 1,
		children: parseInt(initialParams.children) || 0,
		infants: parseInt(initialParams.infants) || 0,
		infants_seat: parseInt(initialParams.infants_seat) || 0,
	});

	const totalPassengers = passengers.adults + passengers.children + passengers.infants + passengers.infants_seat;

	const selectedTariff = tariffOptions.find((t) => t.seat_class === seatClass) || tariffOptions[0];
	const currencySymbol = selectedTariff ? ENUM_LABELS.CURRENCY_SYMBOL[selectedTariff.currency] || '' : '';
	const totalPrice = selectedTariff ? selectedTariff.price * totalPassengers : 0;

	const hasAvailableSeats =
		selectedTariff && selectedTariff.seats_left !== undefined && selectedTariff.seats_left >= totalPassengers;

	const handleConfirm = () => {
		const query = new URLSearchParams();
		query.set('flight', outbound.id);
		if (returnFlight) query.set('return', returnFlight.id);
		if (seatClass) query.set('class', seatClass);
		query.set('adults', passengers.adults);
		query.set('children', passengers.children);
		query.set('infants', passengers.infants);
		query.set('infants_seat', passengers.infants_seat);
		navigate(`/cart?${query.toString()}`);
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
			<DialogTitle>{UI_LABELS.SEARCH.flight_details.select_ticket}</DialogTitle>
			<DialogContent dividers>
				<FlightInfo flight={outbound} airlines={airlines} airports={airports} routes={routes} />
				{returnFlight && (
					<>
						<FlightInfo flight={returnFlight} airlines={airlines} airports={airports} routes={routes} />
						<Divider sx={{ mb: 2 }} />
					</>
				)}

				<Typography gutterBottom>{UI_LABELS.SEARCH.form.seat_class_title}</Typography>
				<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					{tariffOptions.map((t) => (
						<Card
							key={t.seat_class}
							variant={t.seat_class === seatClass ? 'outlined' : 'elevation'}
							sx={{ minWidth: 100 }}
						>
							<CardActionArea onClick={() => setSeatClass(t.seat_class)} sx={{ p: 1 }}>
								<Typography>{ENUM_LABELS.SEAT_CLASS[t.seat_class]}</Typography>
								<Typography>
									{formatNumber(t.price)} {ENUM_LABELS.CURRENCY_SYMBOL[t.currency] || ''}
								</Typography>
								<Typography variant='caption' color='text.secondary'>
									{`${UI_LABELS.SEARCH.flight_details.seats_available}: ${t.seats_available ?? '-'}`}
								</Typography>
							</CardActionArea>
						</Card>
					))}
				</Box>

				<Typography gutterBottom>{UI_LABELS.SEARCH.form.passengers}</Typography>
				<Box>
					{passengerCategories.map((row) => (
						<Card key={row.key} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center' }}>
							<Box sx={{ flexGrow: 1 }}>
								<Typography>{row.label}</Typography>
								<Typography variant='body2' color='text.secondary'>
									{row.desc}
								</Typography>
							</Box>
							<IconButton
								onClick={() => handlePassengerChange(setPassengers, row.key, -1)}
								disabled={disabledPassengerChange(passengers, row.key, -1)}
							>
								<RemoveIcon />
							</IconButton>
							<Typography sx={{ width: 20, textAlign: 'center' }}>{passengers[row.key]}</Typography>
							<IconButton
								onClick={() => handlePassengerChange(setPassengers, row.key, 1)}
								disabled={disabledPassengerChange(passengers, row.key, 1)}
							>
								<AddIcon />
							</IconButton>
						</Card>
					))}
				</Box>

				<Typography sx={{ mt: 2, textAlign: 'right' }}>
					{UI_LABELS.SEARCH.flight_details.total_price}: {formatNumber(totalPrice)} {currencySymbol}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{UI_LABELS.BUTTONS.close}</Button>
				<Tooltip title={!hasAvailableSeats ? UI_LABELS.SEARCH.flight_details.seats_unavailable : ''}>
					<span>
						<Button
							variant='contained'
							color='orange'
							onClick={handleConfirm}
							disabled={!hasAvailableSeats}
						>
							{UI_LABELS.SEARCH.flight_details.select_ticket}
						</Button>
					</span>
				</Tooltip>
			</DialogActions>
		</Dialog>
	);
};

export default SelectTicketDialog;

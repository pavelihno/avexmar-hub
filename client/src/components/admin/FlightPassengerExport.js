import React, { useEffect, useState } from 'react';
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate } from '../utils';
import { UI_LABELS, DATE_API_FORMAT } from '../../constants';
import {
	fetchExportRoutes,
	fetchExportFlights,
	downloadFlightPassengerExport,
} from '../../redux/actions/flightPassengerExport';

const FlightPassengerExport = () => {
	const dispatch = useDispatch();
	const { routes, flights } = useSelector(
		(state) => state.flightPassengerExport,
	);
	const [routeId, setRouteId] = useState('');
	const [flightId, setFlightId] = useState('');

	useEffect(() => {
		dispatch(fetchExportRoutes());
	}, [dispatch]);

	const handleRouteChange = (e) => {
		const id = e.target.value;
		setRouteId(id);
		setFlightId('');
		dispatch(fetchExportFlights(id));
	};

	const handleDownload = async () => {
		const flight = flights.find((f) => f.id === flightId);
		if (!flight) return;
		try {
			const data = await dispatch(
				downloadFlightPassengerExport({
					flightId,
					date: formatDate(flight.scheduled_departure, DATE_API_FORMAT),
				}),
			).unwrap();
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'flight_passengers.xlsx');
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch {}
	};

	return (
		<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
			<FormControl sx={{ minWidth: 200 }}>
				<InputLabel>
					{UI_LABELS.ADMIN.exports.flightPassengers.route}
				</InputLabel>
				<Select
					value={routeId}
					label={UI_LABELS.ADMIN.exports.flightPassengers.route}
					onChange={handleRouteChange}
				>
					{routes.map((r) => (
						<MenuItem key={r.id} value={r.id}>
							{r.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<FormControl sx={{ minWidth: 200 }}>
				<InputLabel>
					{UI_LABELS.ADMIN.exports.flightPassengers.flight}
				</InputLabel>
				<Select
					value={flightId}
					label={UI_LABELS.ADMIN.exports.flightPassengers.flight}
					onChange={(e) => setFlightId(e.target.value)}
					disabled={!routeId}
				>
					{flights.map((f) => (
						<MenuItem key={f.id} value={f.id}>
							{`${f.airline_flight_number} — ${formatDate(f.scheduled_departure)}`}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<Button
				variant="contained"
				onClick={handleDownload}
				disabled={!flightId}
			>
				{UI_LABELS.BUTTONS.download}
			</Button>
		</Box>
	);
};

export default FlightPassengerExport;


import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography, Button, CircularProgress } from '@mui/material';

import Base from '../Base';
import SearchForm from './SearchForm';
import ScheduleTable from './ScheduleTable';
import { DATE_API_FORMAT, UI_LABELS } from '../../constants';
import { fetchScheduleFlights } from '../../redux/actions/search';
import { fetchAirlines } from '../../redux/actions/airline';
import { formatDate } from '../utils';

const Schedule = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const { flights, isLoading: flightsLoading } = useSelector((state) => state.search);
	const { airlines, isLoading: airlinesLoading } = useSelector((state) => state.airlines);
	const [params] = useSearchParams();
	const paramObj = Object.fromEntries(params.entries());
	const paramStr = params.toString();
	const from = params.get('from');
	const to = params.get('to');

	useEffect(() => {
		if (from && to) {
			const p = { ...paramObj };
			// Show schedule starting from today
			p.when = formatDate(new Date(), DATE_API_FORMAT);
			dispatch(fetchScheduleFlights(p));
		}
	}, [dispatch, paramStr, from, to]);

	useEffect(() => {
		document.title = UI_LABELS.SCHEDULE.from_to(from || '', to || '') || UI_LABELS.APP_TITLE;
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [from, to]);

	useEffect(() => {
		dispatch(fetchAirlines());
	}, [dispatch]);

	const getAirlineById = (id) => {
		return airlines.find((a) => a.id === id);
	};

	const outboundFlights = flights.filter((f) => f.direction === 'outbound');
	const returnFlights = flights.filter((f) => f.direction === 'return');

	const [selectedOutbound, setSelectedOutbound] = useState(null);
	const [selectedReturn, setSelectedReturn] = useState(null);

	useEffect(() => {
		if (selectedReturn && !returnFlights.some((f) => f.id === selectedReturn.id)) {
			setSelectedReturn(null);
		}
	}, [returnFlights, selectedReturn]);

	const handleSelectFlights = () => {
		// Ensure at least one flight is selected
		if (!selectedOutbound && !selectedReturn) return;

		let _outbound = null;
		let _return = null;
		let fromLocation = from;
		let toLocation = to;

		// Determine which flight has the earlier date
		if (selectedOutbound && selectedReturn) {
			const outboundDate = selectedOutbound.scheduledDepartureDate;
			const returnDate = selectedReturn.scheduledDepartureDate;

			if (outboundDate <= returnDate) {
				// Current selection is correct
				_outbound = selectedOutbound;
				_return = selectedReturn;
			} else {
				// Swap based on dates
				_outbound = selectedReturn;
				_return = selectedOutbound;
				fromLocation = to;
				toLocation = from;
			}
		} else if (selectedOutbound) {
			// Only outbound is selected
			_outbound = selectedOutbound;
		} else if (selectedReturn) {
			// Only return is selected
			_outbound = selectedReturn;
			fromLocation = to;
			toLocation = from;
		}

		const params = new URLSearchParams();
		params.set('from', fromLocation);
		params.set('to', toLocation);
		params.set('date_mode', 'exact');

		params.set('when', formatDate(_outbound.scheduledDepartureDate, DATE_API_FORMAT));
		params.set('outbound_airline', getAirlineById(_outbound.airlineId).iata_code);
		params.set('outbound_flight', _outbound.flightNumber);

		if (_return) {
			params.set('return', formatDate(_return.scheduledDepartureDate, DATE_API_FORMAT));
			params.set('return_airline', getAirlineById(_return.airlineId).iata_code);
			params.set('return_flight', _return.flightNumber);
		}

		navigate(`/search?${params.toString()}`);
	};

	const isLoading = (flightsLoading && flights.length === 0) || (airlinesLoading && airlines.length === 0);

	return (
		<Base>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SCHEDULE.title}
				</Typography>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
					<Button
						variant='outlined'
						disabled={!selectedOutbound && !selectedReturn}
						onClick={handleSelectFlights}
					>
						{UI_LABELS.SCHEDULE.select_flights}
					</Button>
				</Box>

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
						<CircularProgress />
					</Box>
				) : (
					<>
						<Typography variant='subtitle1' sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
							{UI_LABELS.SCHEDULE.from_to(from || '', to || '')}
						</Typography>
						{outboundFlights.length ? (
							<ScheduleTable
								flights={outboundFlights}
								airlines={airlines}
								selectedId={selectedOutbound?.id || null}
								onSelect={(f) =>
									setSelectedOutbound(selectedOutbound && selectedOutbound.id === f?.id ? null : f)
								}
							/>
						) : (
							<Typography>{UI_LABELS.SCHEDULE.no_results}</Typography>
						)}

						<Typography variant='subtitle1' sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>
							{UI_LABELS.SCHEDULE.from_to(to || '', from || '')}
						</Typography>
						{returnFlights.length ? (
							<ScheduleTable
								flights={returnFlights}
								airlines={airlines}
								selectedId={selectedReturn?.id || null}
								onSelect={(f) =>
									setSelectedReturn(selectedReturn && selectedReturn.id === f?.id ? null : f)
								}
							/>
						) : (
							<Typography>{UI_LABELS.SCHEDULE.no_results}</Typography>
						)}
					</>
				)}
			</Box>
		</Base>
	);
};

export default Schedule;

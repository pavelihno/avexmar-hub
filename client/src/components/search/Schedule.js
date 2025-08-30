import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Box, Typography, Button, CircularProgress, TableContainer, useMediaQuery } from '@mui/material';

import Base from '../Base';
import SearchForm from './SearchForm';
import ScheduleTable from './ScheduleTable';
import { DATE_API_FORMAT, UI_LABELS } from '../../constants';
import { fetchScheduleFlights } from '../../redux/actions/search';
import { formatDate } from '../utils';

const Schedule = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const { flights, flightsLoading: isLoading } = useSelector((state) => state.search);
	const [params] = useSearchParams();
	const paramObj = Object.fromEntries(params.entries());
	const paramStr = params.toString();
	const from = params.get('from');
	const to = params.get('to');
	const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));

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
		params.set('outbound_airline', _outbound.airline.iata_code);
		params.set('outbound_flight', _outbound.flightNumber);

		if (_return) {
			params.set('return', formatDate(_return.scheduledDepartureDate, DATE_API_FORMAT));
			params.set('return_airline', _return.airline.iata_code);
			params.set('return_flight', _return.flightNumber);
		}

		navigate(`/search?${params.toString()}`);
	};

	return (
		<Base>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 2 }}>
					{UI_LABELS.SCHEDULE.title}
				</Typography>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
							<TableContainer sx={{ overflowX: isSmallScreen ? 'auto' : 'visible' }}>
								<ScheduleTable
									flights={outboundFlights}
									selectedId={selectedOutbound?.id || null}
									onSelect={(f) =>
										setSelectedOutbound(
											selectedOutbound && selectedOutbound.id === f?.id ? null : f
										)
									}
								/>
							</TableContainer>
						) : (
							<Alert severity='info'>{UI_LABELS.SEARCH.no_results}</Alert>
						)}

						<Typography variant='subtitle1' sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>
							{UI_LABELS.SCHEDULE.from_to(to || '', from || '')}
						</Typography>
						{returnFlights.length > 0 ? (
							<TableContainer sx={{ overflowX: isSmallScreen ? 'auto' : 'visible' }}>
								<ScheduleTable
									flights={returnFlights}
									selectedId={selectedReturn?.id || null}
									onSelect={(f) =>
										setSelectedReturn(selectedReturn && selectedReturn.id === f?.id ? null : f)
									}
								/>
							</TableContainer>
						) : (
							<Alert severity='info'>{UI_LABELS.SEARCH.no_results}</Alert>
						)}
					</>
				)}
			</Box>
		</Base>
	);
};

export default Schedule;

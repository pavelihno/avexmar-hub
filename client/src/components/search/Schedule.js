import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import Base from '../Base';
import SearchForm from './SearchForm';
import ScheduleTable from './ScheduleTable';
import { UI_LABELS } from '../../constants';
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
			p.when = formatDate(new Date(), 'yyyy-MM-dd');
			dispatch(fetchScheduleFlights(p));
		}
	}, [dispatch, paramStr, from, to]);

	useEffect(() => {
		document.title = UI_LABELS.SCHEDULE.from_to(from || '', to || '');
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [from, to]);

	useEffect(() => {
		dispatch(fetchAirlines());
	}, [dispatch]);

	const outboundFlights = useMemo(() => flights.filter((f) => f.direction === 'outbound'), [flights]);

	const returnFlights = useMemo(() => flights.filter((f) => f.direction === 'return'), [flights]);

	const [selectedOutbound, setSelectedOutbound] = useState(null);
	const [selectedReturn, setSelectedReturn] = useState(null);

	const filteredReturnFlights = useMemo(() => {
		if (!selectedOutbound) return returnFlights;
		return returnFlights.filter(
			(f) => new Date(f.scheduled_departure) >= new Date(selectedOutbound.scheduled_departure)
		);
	}, [returnFlights, selectedOutbound]);

	useEffect(() => {
		if (selectedReturn && !filteredReturnFlights.some((f) => f.id === selectedReturn.id)) {
			setSelectedReturn(null);
		}
	}, [filteredReturnFlights, selectedReturn]);

	const handleSelectFlights = () => {
		if (!selectedOutbound) return;
		if (
			selectedReturn &&
			new Date(selectedReturn.scheduled_departure) < new Date(selectedOutbound.scheduled_departure)
		) {
			alert(UI_LABELS.HOME.search.errors.invalid_return);
			return;
		}
		const params = new URLSearchParams();
		params.set('from', from);
		params.set('to', to);
		params.set('when', selectedOutbound.scheduled_departure);
		params.set('date_mode', 'exact');
		params.set('flight', selectedOutbound.airline_flight_number);
		if (selectedReturn) params.set('return', selectedReturn.scheduled_departure);
		navigate(`/search?${params.toString()}`);
	};

	const isLoading = (flightsLoading && flights.length === 0) || (airlinesLoading && airlines.length === 0);

	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SCHEDULE.title}
				</Typography>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
					<Button variant='contained' disabled={!selectedOutbound} onClick={handleSelectFlights}>
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
						{filteredReturnFlights.length ? (
							<ScheduleTable
								flights={filteredReturnFlights}
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

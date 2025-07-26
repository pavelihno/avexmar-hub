import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Card, Box, Typography, Button, Divider, IconButton } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import ShareIcon from '@mui/icons-material/Share';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { fetchAirports } from '../../redux/actions/airport';
import { fetchAirlines } from '../../redux/actions/airline';
import { fetchRoutes } from '../../redux/actions/route';
import { formatDate, formatTime } from '../utils';
import { DATE_WEEKDAY_FORMAT } from '../../constants/formats';

const Segment = ({ flight, isOutbound }) => {
	if (!flight) return null;

	const dispatch = useDispatch();
	const { airlines, isLoading: airlinesLoading } = useSelector((s) => s.airlines);
	const { airports, isLoading: airportsLoading } = useSelector((s) => s.airports);
	const { routes, isLoading: routesLoading } = useSelector((s) => s.routes);

	useEffect(() => {
		dispatch(fetchAirports());
		dispatch(fetchAirlines());
		dispatch(fetchRoutes());
	}, [dispatch]);

	const airline = useMemo(() => {
		if (!airlinesLoading) {
			return airlines.find((a) => a.id === flight.airline_id) || null;
		}
		return null;
	}, [airlines, airlinesLoading, flight.airline_id]);

	const route = useMemo(() => {
		if (!routesLoading) {
			return routes.find((r) => r.id === flight.route_id) || null;
		}
		return null;
	}, [routes, routesLoading, flight.route_id]);

	const originAirport = useMemo(() => {
		if (!airportsLoading && route) {
			return airports.find((a) => a.id === route.origin_airport_id) || null;
		}
		return null;
	}, [airports, airportsLoading, route]);

	const destinationAirport = useMemo(() => {
		if (!airportsLoading && route) {
			return airports.find((a) => a.id === route.destination_airport_id) || null;
		}
		return null;
	}, [airports, airportsLoading, route]);

	return (
		<Box sx={{ mb: 1 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
				<Typography variant='subtitle2' sx={{ fontWeight: 600, mr: 1 }}>
					{airline ? airline.name || airline.id : ''}
				</Typography>
				<IconButton
					size='small'
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
					}}
				>
					<ShareIcon fontSize='small' sx={{ ml: 0.5 }} />
				</IconButton>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box>
					<Typography variant='h6' className='mono-nums'>
						{formatTime(flight.scheduled_departure_time)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{formatDate(flight.scheduled_departure, DATE_WEEKDAY_FORMAT)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{originAirport ? originAirport.name : originAirport?.id}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
					<Box sx={{ borderBottom: '1px dashed', width: 50 }} />
					<FlightIcon sx={{ transform: `rotate(${isOutbound ? 90 : -90}deg)` }} />
					<Box sx={{ borderBottom: '1px dashed', width: 50 }} />
				</Box>
				<Box>
					<Typography variant='h6' className='mono-nums'>
						{formatTime(flight.scheduled_arrival_time)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{formatDate(flight.scheduled_arrival, DATE_WEEKDAY_FORMAT)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{destinationAirport ? destinationAirport.name : destinationAirport?.id}
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

const SearchResultCard = ({ outbound, returnFlight }) => {
	const currency = outbound.currency || returnFlight?.currency;
	const currencySymbol = currency ? ENUM_LABELS.CURRENCY_SYMBOL[currency] : '';
	const totalPrice =
		outbound.price + (returnFlight?.price || 0) || outbound.min_price || returnFlight?.min_price || 0;

	return (
		<Card sx={{ display: 'flex', p: 2, mb: 2 }}>
			<Box
				sx={{
					width: 160,
					textAlign: 'center',
					pr: 2,
					borderRight: '1px solid #eee',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
				}}
			>
				<Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
					{`${totalPrice !== 0 ? totalPrice : '--'} ${currencySymbol}`}
				</Typography>
				<Button
					variant='contained'
					sx={{
						background: '#ff7f2a',
						color: '#fff',
						borderRadius: 2,
						boxShadow: 'none',
						textTransform: 'none',
						'&:hover': { background: '#ff6600' },
					}}
					onClick={() => {
						const url = `/cart?flight=${outbound.id}${returnFlight ? `&return=${returnFlight.id}` : ''}`;
						window.open(url, '_blank');
					}}
				>
					{UI_LABELS.SEARCH.flight_details.select_flight}
				</Button>
			</Box>
			<Box sx={{ flexGrow: 1, pl: 2 }}>
				<Segment flight={outbound} isOutbound />
				{returnFlight && <Divider sx={{ my: 1 }} />}
				{returnFlight && <Segment flight={returnFlight} isOutbound={false} />}
			</Box>
		</Card>
	);
};

export default SearchResultCard;

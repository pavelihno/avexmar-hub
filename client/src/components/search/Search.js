import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { fetchSearchFlights, fetchNearbyDateFlights } from '../../redux/actions/search';
import { fetchAirports } from '../../redux/actions/airport';
import { fetchAirlines } from '../../redux/actions/airline';
import { fetchRoutes } from '../../redux/actions/route';
import { formatDate, getFlightDurationMinutes } from '../utils';

const Search = () => {
	const dispatch = useDispatch();
	const { flights, nearbyFlights, isLoading } = useSelector((state) => state.search);
	const { airlines, isLoading: airlinesLoading } = useSelector((state) => state.airlines);
	const { airports, isLoading: airportsLoading } = useSelector((state) => state.airports);
	const { routes, isLoading: routesLoading } = useSelector((state) => state.routes);
	const detailsLoading = airlinesLoading || airportsLoading || routesLoading;
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const paramObj = Object.fromEntries(params.entries());
	const paramStr = params.toString();
	const from = params.get('from');
	const to = params.get('to');
	const depart = params.get('when');
	const returnDate = params.get('return');
	const departFrom = params.get('when_from');
	const departTo = params.get('when_to');
	const returnFrom = params.get('return_from');
	const returnTo = params.get('return_to');
	const isExact = params.get('date_mode') === 'exact';
	const hasReturn = returnDate || returnFrom || returnTo;

	const [sortKey, setSortKey] = useState('price');
	const [nearDates, setNearDates] = useState([]);
	const [visibleCount, setVisibleCount] = useState(10);

	useEffect(() => {
		dispatch(fetchAirports());
		dispatch(fetchAirlines());
		dispatch(fetchRoutes());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchSearchFlights(paramObj));
	}, [dispatch, paramStr]);

	useEffect(() => {
		const titleFrom = departFrom || depart || '';
		const titleTo = returnTo || returnDate || '';
		document.title = UI_LABELS.SEARCH.from_to_date(from || '', to || '', titleFrom, titleTo);
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [from, to, depart, returnDate, departFrom, returnTo]);

	useEffect(() => {
		const fetchNearDates = () => {
			if (!from || !to || !(depart || departFrom)) {
				setNearDates([]);
				return;
			}
			const baseDate = departFrom || depart;
			try {
				const start = new Date(baseDate);
				const end = new Date(baseDate);
				start.setDate(start.getDate() - 30);
				end.setDate(end.getDate() + 30);
				const paramsRange = {
					from,
					to,
					when_from: formatDate(start, 'yyyy-MM-dd'),
					when_to: formatDate(end, 'yyyy-MM-dd'),
					class: params.get('class'),
				};
				dispatch(fetchNearbyDateFlights(paramsRange));
			} catch (e) {
				console.error(e);
				setNearDates([]);
			}
		};
		fetchNearDates();
	}, [from, to, depart, departFrom, dispatch, params]);

	useEffect(() => {
		if (!nearbyFlights.length) {
			setNearDates([]);
			return;
		}

		const map = {};
		for (const f of nearbyFlights) {
			const d = f.scheduled_departure;
			const price = f.price || f.min_price || 0;
			if (!map[d] || price < map[d].price) {
				map[d] = { price, currency: f.currency };
			}
		}

		const arr = Object.entries(map)
			.sort((a, b) => new Date(a[0]) - new Date(b[0]))
			.map(([date, info]) => ({ date, price: info.price, currency: info.currency }));

		setNearDates(arr);
	}, [nearbyFlights]);

	const grouped = [];
	if (!isExact) {
		const outbounds = flights.filter((f) => f.direction !== 'return');
		const returns = flights.filter((f) => f.direction === 'return');
		for (const out of outbounds) {
			if (returns.length) {
				for (const r of returns) grouped.push({ outbound: out, returnFlight: r });
			} else {
				grouped.push({ outbound: out });
			}
		}
	} else if (hasReturn) {
		for (let i = 0; i < flights.length; i += 2) {
			grouped.push({ outbound: flights[i], returnFlight: flights[i + 1] });
		}
	} else {
		for (const f of flights) grouped.push({ outbound: f });
	}

	const getTotalPrice = (g) => {
		return (
			(g.outbound.price || g.outbound.min_price || 0) +
			(g.returnFlight ? g.returnFlight.price || g.returnFlight.min_price || 0 : 0)
		);
	};

	const sortGroups = (items) => {
		return [...items].sort((a, b) => {
			switch (sortKey) {
				case 'price':
					return getTotalPrice(a) - getTotalPrice(b);
				case 'arrival':
					return (a.outbound.scheduled_arrival_time || '').localeCompare(
						b.outbound.scheduled_arrival_time || ''
					);
				case 'departure':
					return (a.outbound.scheduled_departure_time || '').localeCompare(
						b.outbound.scheduled_departure_time || ''
					);
				case 'duration':
					return getFlightDurationMinutes(a.outbound) - getFlightDurationMinutes(b.outbound);
				default:
					return 0;
			}
		});
	};

	const sortedGrouped = sortGroups(grouped);

	return (
		<Base>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SEARCH.results}
				</Typography>

				{nearDates.length > 0 && (
					<Box sx={{ display: 'flex', overflowX: 'auto', mb: 2 }}>
						<Typography variant='body2' sx={{ mr: 1, flexShrink: 0 }}>
							{UI_LABELS.SEARCH.nearby_dates}:
						</Typography>
						{nearDates.map((d) => (
							<Button
								key={d.date}
								size='small'
								variant='outlined'
								sx={{ mr: 1, flexShrink: 0 }}
								onClick={() => {
									const newParams = new URLSearchParams(paramObj);
									newParams.set('when', d.date);
									newParams.delete('when_from');
									newParams.delete('when_to');
									navigate(`/search?${newParams.toString()}`);
								}}
							>
								{`${formatDate(d.date, 'dd.MM')} - ${d.price} ${
									ENUM_LABELS.CURRENCY_SYMBOL[d.currency] || ''
								}`}
							</Button>
						))}
					</Box>
				)}

				<FormControl size='small' sx={{ mb: 2, minWidth: 200 }}>
					<InputLabel id='sort-label'>{UI_LABELS.SEARCH.sort.label}</InputLabel>
					<Select
						labelId='sort-label'
						value={sortKey}
						label={UI_LABELS.SEARCH.sort.label}
						onChange={(e) => setSortKey(e.target.value)}
					>
						<MenuItem value='price'>{UI_LABELS.SEARCH.sort.price}</MenuItem>
						<MenuItem value='arrival'>{UI_LABELS.SEARCH.sort.arrival}</MenuItem>
						<MenuItem value='departure'>{UI_LABELS.SEARCH.sort.departure}</MenuItem>
						<MenuItem value='duration'>{UI_LABELS.SEARCH.sort.duration}</MenuItem>
					</Select>
				</FormControl>

				{isLoading && flights.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
						<CircularProgress />
					</Box>
				) : sortedGrouped && sortedGrouped.length ? (
					sortedGrouped
						.slice(0, visibleCount)
						.map((g, idx) => (
							<SearchResultCard
								key={idx}
								outbound={g.outbound}
								returnFlight={g.returnFlight}
								airlines={airlines}
								airports={airports}
								routes={routes}
								isLoading={detailsLoading}
							/>
						))
				) : (
					<Typography>{UI_LABELS.SEARCH.no_results}</Typography>
				)}

				{visibleCount < sortedGrouped.length && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
						<Button variant='contained' onClick={() => setVisibleCount((v) => v + 10)}>
							{UI_LABELS.SEARCH.show_more}
						</Button>
					</Box>
				)}
			</Box>
		</Base>
	);
};

export default Search;

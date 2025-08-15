import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
	Alert,
	Box,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Button,
	CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS, ENUM_LABELS, DATE_API_FORMAT } from '../../constants';
import { fetchNearbyOutboundFlights, fetchNearbyReturnFlights, fetchSearchFlights } from '../../redux/actions/search';
import { formatDate, formatNumber, parseDate, parseTime } from '../utils';

const Search = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const {
		flights,
		flightsLoading,
		nearbyOutboundFlights,
		nearbyOutboundLoading,
		nearbyReturnFlights,
		nearbyReturnLoading,
	} = useSelector((state) => state.search);
	const isLoading = flightsLoading || nearbyOutboundLoading || nearbyReturnLoading;

	const [params] = useSearchParams();
	const initialParams = Object.fromEntries(params.entries());
	const from = initialParams.from;
	const to = initialParams.to;
	const depart = initialParams.when;
	const returnDate = initialParams.return;
	const departFrom = initialParams.when_from;
	const departTo = initialParams.when_to;
	const returnFrom = initialParams.return_from;
	const returnTo = initialParams.return_to;
	const isExact = initialParams.date_mode === 'exact';
	const hasReturn = !!(returnDate || returnFrom || returnTo);

	const [sortKey, setSortKey] = useState('departure_date');
	const [sortOrder, setSortOrder] = useState('asc');
	const [visibleCount, setVisibleCount] = useState(10);

	useEffect(() => {
		dispatch(fetchSearchFlights(initialParams));
	}, [dispatch, params]);

	const [nearDatesOutbound, setNearDatesOutbound] = useState([]);
	const [nearDatesReturn, setNearDatesReturn] = useState([]);

	useEffect(() => {
		setNearDatesOutbound(buildNearDates(nearbyOutboundFlights, depart));
	}, [nearbyOutboundFlights, depart]);

	useEffect(() => {
		setNearDatesReturn(buildNearDates(nearbyReturnFlights, returnDate));
	}, [nearbyReturnFlights, returnDate]);

	useEffect(() => {
		const titleFrom = departFrom || depart || '';
		const titleTo = returnTo || returnDate || '';
		document.title = UI_LABELS.SEARCH.from_to_date(from || '', to || '', titleFrom, titleTo) || UI_LABELS.APP_TITLE;
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [params]);

	const buildNearDates = (flights, selectedDate) => {
		// Group flights by date and find lowest price for each
		const map = flights
			.filter((f) => f.price != null || f.min_price != null)
			.reduce((acc, flight) => {
				const date = flight.scheduled_departure;
				const price = flight.price || flight.min_price || 0;

				if (!acc[date] || price < acc[date].price) {
					acc[date] = {
						price,
						currency: flight.currency,
					};
				}
				return acc;
			}, {});

		// Get nearby dates, excluding selected date
		const sortedDates = Object.entries(map)
			.filter(([date]) => date !== selectedDate)
			.map(([date, info]) => ({
				date,
				price: info.price,
				currency: info.currency,
				diff: Math.abs(parseDate(date) - parseDate(selectedDate)),
			}))
			.sort((a, b) => a.diff - b.diff);

		// Return top 3 closest dates, sorted chronologically
		return sortedDates
			.slice(0, 3)
			.map(({ date, price, currency }) => ({ date, price, currency }))
			.sort((a, b) => parseDate(a.date) - parseDate(b.date));
	};

	const fetchNearbyDates = (date, direction) => {
		const fetchAction = direction === 'return' ? fetchNearbyReturnFlights : fetchNearbyOutboundFlights;

		if (!isExact || !from || !to || !date) {
			return;
		}

		const selectedDate = parseDate(date);
		const start = parseDate(selectedDate);
		const end = parseDate(selectedDate);

		start.setDate(start.getDate() - 30);
		end.setDate(end.getDate() + 30);

		const requestParams = {
			...initialParams,
			date_mode: 'flex',
		};

		if (direction === 'return') {
			requestParams.return_from = formatDate(start, DATE_API_FORMAT);
			requestParams.return_to = formatDate(end, DATE_API_FORMAT);
		} else {
			requestParams.when_from = formatDate(start, DATE_API_FORMAT);
			requestParams.when_to = formatDate(end, DATE_API_FORMAT);
		}

		delete requestParams.when;
		delete requestParams.return;

		dispatch(fetchAction(requestParams));
	};

	useEffect(() => {
		fetchNearbyDates(depart, 'outbound');
		if (hasReturn) fetchNearbyDates(returnDate, 'return');
	}, [params]);

	const filteredFlights = flights.filter((f) => f.price != null || f.min_price != null);

	const grouped = [];
	if (hasReturn) {
		const outbounds = filteredFlights.filter((f) => f.direction !== 'return');
		const returns = filteredFlights.filter((f) => f.direction === 'return');

		// Create all valid combinations of outbound and return flights
		for (const o of outbounds) {
			const outboundArrival = parseDate(o.scheduled_arrival);
			const outboundArrivalTime = parseTime(o.scheduled_arrival_time);

			const validReturns = returns.filter((r) => {
				const returnDeparture = parseDate(r.scheduled_departure);
				const returnDepartureTime = parseTime(r.scheduled_departure_time);

				// Ensure return departure is after outbound arrival
				return (
					returnDeparture > outboundArrival ||
					(returnDeparture.getTime() === outboundArrival.getTime() &&
						returnDepartureTime >= outboundArrivalTime)
				);
			});

			// Only create groups for outbound flights that have at least one valid return flight
			if (validReturns.length > 0) {
				// Create a group for each valid combination
				for (const ret of validReturns) {
					grouped.push({ outbound: o, returnFlight: ret });
				}
			}
		}
	} else {
		// One-way flights
		for (const f of filteredFlights) grouped.push({ outbound: f });
	}

	const getTotalPrice = (g) => {
		return (
			(g.outbound.price || g.outbound.min_price || 0) +
			(g.returnFlight ? g.returnFlight.price || g.returnFlight.min_price || 0 : 0)
		);
	};

	const sortGroups = (items) => {
		return [...items].sort((a, b) => {
			let res = 0;
			switch (sortKey) {
				case 'price':
					res = getTotalPrice(a) - getTotalPrice(b);
					break;
				case 'departure_date': {
					const dateA = parseDate(a.outbound.scheduled_departure);
					const dateB = parseDate(b.outbound.scheduled_departure);
					res = dateA - dateB;
					if (res === 0) {
						res =
							parseTime(a.outbound.scheduled_departure_time) -
							parseTime(b.outbound.scheduled_departure_time);
					}
					break;
				}
				case 'departure_time':
					res =
						parseTime(a.outbound.scheduled_departure_time) - parseTime(b.outbound.scheduled_departure_time);
					break;
				case 'arrival_date': {
					const dateA = parseDate(a.outbound.scheduled_arrival);
					const dateB = parseDate(b.outbound.scheduled_arrival);
					res = dateA - dateB;
					if (res === 0) {
						res =
							parseTime(a.outbound.scheduled_arrival_time) - parseTime(b.outbound.scheduled_arrival_time);
					}
					break;
				}
				case 'arrival_time':
					res = parseTime(a.outbound.scheduled_arrival_time) - parseTime(b.outbound.scheduled_arrival_time);
					break;
				case 'duration':
					res = (a.outbound.duration ?? 0) - (b.outbound.duration ?? 0);
					break;
				default:
					res = 0;
			}
			return sortOrder === 'asc' ? res : -res;
		});
	};

	const sortedGrouped = sortGroups(grouped);

	const handleSort = (key) => {
		if (key === sortKey) {
			setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortOrder('asc');
		}
	};

	return (
		<Base>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={initialParams} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 2 }}>
					{UI_LABELS.SEARCH.results}
				</Typography>

				{isExact && (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							mb: 3,
							columnGap: 2,
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<CalendarMonthIcon color='action' sx={{ mr: 1 }} />
							<Typography variant='subtitle1' sx={{}}>
								{UI_LABELS.SEARCH.nearby_dates.title}:
							</Typography>
						</Box>
						{nearDatesOutbound.length > 0 ? (
							<Box>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexWrap: 'nowrap',
										overflowX: 'auto',
										columnGap: 1,
										width: '100%',
									}}
								>
									{nearDatesOutbound.map((d) => (
										<Button
											key={d.date}
											size='small'
											variant='outlined'
											sx={{
												flexShrink: 0,
												minWidth: 'auto',
												borderRadius: 1,
												px: 1.5,
											}}
											onClick={() => {
												const newParams = new URLSearchParams(initialParams);
												newParams.set('when', d.date);
												['when_from', 'when_to', 'outbound_airline', 'outbound_flight'].forEach(
													(key) => {
														newParams.delete(key);
													}
												);
												navigate(`/search?${newParams.toString()}`);
											}}
										>
											{`${formatDate(d.date, 'dd.MM')} - ${formatNumber(d.price)} ${
												ENUM_LABELS.CURRENCY_SYMBOL[d.currency] || ''
											}`}
										</Button>
									))}
								</Box>
							</Box>
						) : (
							<Button
								size='small'
								variant='outlined'
								disabled
								sx={{
									flexShrink: 0,
									minWidth: 'auto',
									borderRadius: 1,
									px: 1.5,
									cursor: 'default',
								}}
							>
								{UI_LABELS.SEARCH.nearby_dates.no_outbound}
							</Button>
						)}
						{hasReturn && (
							<>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<ArrowForwardIcon color='action' />
								</Box>

								{nearDatesReturn.length > 0 ? (
									<Box>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexWrap: 'nowrap',
												overflowX: 'auto',
												columnGap: 1,
												width: '100%',
											}}
										>
											{nearDatesReturn.map((d) => (
												<Button
													key={d.date}
													size='small'
													variant='outlined'
													sx={{
														flexShrink: 0,
														minWidth: 'auto',
														borderRadius: 1,
														px: 1.5,
													}}
													onClick={() => {
														const newParams = new URLSearchParams(initialParams);
														newParams.set('return', d.date);
														[
															'return_from',
															'return_to',
															'return_airline',
															'return_flight',
														].forEach((key) => {
															newParams.delete(key);
														});
														navigate(`/search?${newParams.toString()}`);
													}}
												>
													{`${formatDate(d.date, 'dd.MM')} - ${formatNumber(d.price)} ${
														ENUM_LABELS.CURRENCY_SYMBOL[d.currency] || ''
													}`}
												</Button>
											))}
										</Box>
									</Box>
								) : (
									<Button
										size='small'
										variant='outlined'
										disabled
										sx={{
											flexShrink: 0,
											minWidth: 'auto',
											borderRadius: 1,
											px: 1.5,
											cursor: 'default',
										}}
									>
										{UI_LABELS.SEARCH.nearby_dates.no_return}
									</Button>
								)}
							</>
						)}
					</Box>
				)}

				{!isLoading && flights.length !== 0 && (
					<Box sx={{ display: 'flex', mb: 2, justifyContent: 'flex-end' }}>
						<FormControl size='small' sx={{ width: 210, flexShrink: 0 }}>
							<InputLabel id='sort-label'>{UI_LABELS.SEARCH.sort.label}</InputLabel>
							<Select
								labelId='sort-label'
								value={sortKey}
								label={UI_LABELS.SEARCH.sort.label}
								onChange={() => {}}
							>
								<MenuItem value='price' onClick={() => handleSort('price')}>
									{UI_LABELS.SEARCH.sort.price}{' '}
									{sortKey === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
								<MenuItem value='departure_date' onClick={() => handleSort('departure_date')}>
									{UI_LABELS.SEARCH.sort.departure_date}{' '}
									{sortKey === 'departure_date' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
								<MenuItem value='departure_time' onClick={() => handleSort('departure_time')}>
									{UI_LABELS.SEARCH.sort.departure_time}{' '}
									{sortKey === 'departure_time' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
								<MenuItem value='arrival_date' onClick={() => handleSort('arrival_date')}>
									{UI_LABELS.SEARCH.sort.arrival_date}{' '}
									{sortKey === 'arrival_date' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
								<MenuItem value='arrival_time' onClick={() => handleSort('arrival_time')}>
									{UI_LABELS.SEARCH.sort.arrival_time}{' '}
									{sortKey === 'arrival_time' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
								<MenuItem value='duration' onClick={() => handleSort('duration')}>
									{UI_LABELS.SEARCH.sort.duration}{' '}
									{sortKey === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
								</MenuItem>
							</Select>
						</FormControl>
					</Box>
				)}

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
						<CircularProgress />
					</Box>
				) : sortedGrouped && sortedGrouped.length !== 0 ? (
					sortedGrouped
						.slice(0, visibleCount)
						.map((g, idx) => (
							<SearchResultCard
								key={idx}
								outbound={g.outbound}
								returnFlight={g.returnFlight}
								isLoading={isLoading}
							/>
						))
				) : (
					<Alert severity='info'>{UI_LABELS.SEARCH.no_results}</Alert>
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

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS, ENUM_LABELS, DATE_API_FORMAT } from '../../constants';
import { fetchSearchFlights } from '../../redux/actions/search';
import { fetchAirports } from '../../redux/actions/airport';
import { fetchAirlines } from '../../redux/actions/airline';
import { fetchRoutes } from '../../redux/actions/route';
import { formatDate, formatNumber, getFlightDurationMinutes } from '../utils';
import { serverApi } from '../../api';

const Search = () => {
	const dispatch = useDispatch();
        const { flights, isLoading } = useSelector((state) => state.search);
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
        const [sortOrder, setSortOrder] = useState('asc');
        const [nearDatesOutbound, setNearDatesOutbound] = useState([]);
        const [nearDatesReturn, setNearDatesReturn] = useState([]);
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

        const buildNearDates = (flights) => {
                const map = {};
                for (const f of flights) {
                        const d = f.scheduled_departure;
                        const price = f.price || f.min_price || 0;
                        if (!map[d] || price < map[d].price) {
                                map[d] = { price, currency: f.currency };
                        }
                }
                return Object.entries(map)
                        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                        .map(([date, info]) => ({ date, price: info.price, currency: info.currency }));
        };

        useEffect(() => {
                const fetchNearDates = async () => {
                        if (!isExact || !from || !to || !depart) {
                                setNearDatesOutbound([]);
                                return;
                        }
                        try {
                                const start = new Date(depart);
                                const end = new Date(depart);
                                start.setDate(start.getDate() - 30);
                                end.setDate(end.getDate() + 30);
                                const paramsRange = {
                                        from,
                                        to,
                                        when_from: formatDate(start, DATE_API_FORMAT),
                                        when_to: formatDate(end, DATE_API_FORMAT),
                                        class: params.get('class'),
                                };
                                const res = await serverApi.get('/search/flights', { params: paramsRange });
                                setNearDatesOutbound(buildNearDates(res.data));
                        } catch (e) {
                                console.error(e);
                                setNearDatesOutbound([]);
                        }
                };
                fetchNearDates();
        }, [isExact, from, to, depart, params]);

        useEffect(() => {
                const fetchReturnNearDates = async () => {
                        if (!isExact || !from || !to || !returnDate) {
                                setNearDatesReturn([]);
                                return;
                        }
                        try {
                                const start = new Date(returnDate);
                                const end = new Date(returnDate);
                                start.setDate(start.getDate() - 30);
                                end.setDate(end.getDate() + 30);
                                const paramsRange = {
                                        from: to,
                                        to: from,
                                        when_from: formatDate(start, DATE_API_FORMAT),
                                        when_to: formatDate(end, DATE_API_FORMAT),
                                        class: params.get('class'),
                                };
                                const res = await serverApi.get('/search/flights', { params: paramsRange });
                                setNearDatesReturn(buildNearDates(res.data));
                        } catch (e) {
                                console.error(e);
                                setNearDatesReturn([]);
                        }
                };
                fetchReturnNearDates();
        }, [isExact, from, to, returnDate, params]);

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

        const parseTime = (t) => {
                if (!t) return 0;
                const [h = 0, m = 0, s = 0] = t.split(':').map((v) => parseInt(v, 10));
                return h * 3600 + m * 60 + s;
        };

        const sortGroups = (items) => {
                return [...items].sort((a, b) => {
                        let res = 0;
                        switch (sortKey) {
                                case 'price':
                                        res = getTotalPrice(a) - getTotalPrice(b);
                                        break;
                                case 'arrival_time':
                                        res = parseTime(a.outbound.scheduled_arrival_time) - parseTime(b.outbound.scheduled_arrival_time);
                                        break;
                                case 'arrival_date':
                                        res = new Date(a.outbound.scheduled_arrival) - new Date(b.outbound.scheduled_arrival);
                                        break;
                                case 'departure_time':
                                        res =
                                                parseTime(a.outbound.scheduled_departure_time) -
                                                parseTime(b.outbound.scheduled_departure_time);
                                        break;
                                case 'departure_date':
                                        res = new Date(a.outbound.scheduled_departure) - new Date(b.outbound.scheduled_departure);
                                        break;
                                case 'duration':
                                        res = getFlightDurationMinutes(a.outbound) - getFlightDurationMinutes(b.outbound);
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
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SEARCH.results}
				</Typography>

                                <Box
                                        sx={{
                                                display: 'flex',
                                                mb: 2,
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 2,
                                        }}
                                >
                                        <Box
                                                sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flex: 1,
                                                        minWidth: 0,
                                                        gap: 2,
                                                }}
                                        >
                                                {nearDatesOutbound.length > 0 && (
                                                        <Box
                                                                sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        width: '100%',
                                                                        overflow: 'hidden',
                                                                }}
                                                        >
                                                                <Box
                                                                        sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                mr: 2,
                                                                                flexShrink: 0,
                                                                                '& > svg': { mr: 1 },
                                                                        }}
                                                                >
                                                                        <CalendarMonthIcon color='action' />
                                                                        <Typography variant='subtitle1'>{UI_LABELS.SEARCH.nearby_dates}:</Typography>
                                                                </Box>
                                                                <Box
                                                                        sx={{
                                                                                display: 'flex',
                                                                                gap: 1,
                                                                                flexWrap: 'nowrap',
                                                                                overflowX: 'auto',
                                                                                pb: 1,
                                                                                flex: 1,
                                                                                minWidth: 0,
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
                                                                                                const newParams = new URLSearchParams(paramObj);
                                                                                                newParams.set('when', d.date);
                                                                                                newParams.delete('when_from');
                                                                                                newParams.delete('when_to');
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
                                                )}
                                                {nearDatesReturn.length > 0 && (
                                                        <Box
                                                                sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        width: '100%',
                                                                        overflow: 'hidden',
                                                                }}
                                                        >
                                                                <Box
                                                                        sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                mr: 2,
                                                                                flexShrink: 0,
                                                                                '& > svg': { mr: 1 },
                                                                        }}
                                                                >
                                                                        <CalendarMonthIcon color='action' />
                                                                        <Typography variant='subtitle1'>{UI_LABELS.SEARCH.nearby_dates}:</Typography>
                                                                </Box>
                                                                <Box
                                                                        sx={{
                                                                                display: 'flex',
                                                                                gap: 1,
                                                                                flexWrap: 'nowrap',
                                                                                overflowX: 'auto',
                                                                                pb: 1,
                                                                                flex: 1,
                                                                                minWidth: 0,
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
                                                                                                const newParams = new URLSearchParams(paramObj);
                                                                                                newParams.set('return', d.date);
                                                                                                newParams.delete('return_from');
                                                                                                newParams.delete('return_to');
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
                                                )}
                                        </Box>

                                        <FormControl size='small' sx={{ width: 200, flexShrink: 0 }}>
                                                <InputLabel id='sort-label'>{UI_LABELS.SEARCH.sort.label}</InputLabel>
                                                <Select
                                                        labelId='sort-label'
                                                        value={sortKey}
                                                        label={UI_LABELS.SEARCH.sort.label}
                                                        onChange={() => {}}
                                                >
                                                        <MenuItem value='price' onClick={() => handleSort('price')}>
                                                                {UI_LABELS.SEARCH.sort.price}
                                                        </MenuItem>
                                                        <MenuItem value='arrival_time' onClick={() => handleSort('arrival_time')}>
                                                                {UI_LABELS.SEARCH.sort.arrival_time}
                                                        </MenuItem>
                                                        <MenuItem value='arrival_date' onClick={() => handleSort('arrival_date')}>
                                                                {UI_LABELS.SEARCH.sort.arrival_date}
                                                        </MenuItem>
                                                        <MenuItem value='departure_time' onClick={() => handleSort('departure_time')}>
                                                                {UI_LABELS.SEARCH.sort.departure_time}
                                                        </MenuItem>
                                                        <MenuItem value='departure_date' onClick={() => handleSort('departure_date')}>
                                                                {UI_LABELS.SEARCH.sort.departure_date}
                                                        </MenuItem>
                                                        <MenuItem value='duration' onClick={() => handleSort('duration')}>
                                                                {UI_LABELS.SEARCH.sort.duration}
                                                        </MenuItem>
                                                </Select>
                                        </FormControl>
                                </Box>

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

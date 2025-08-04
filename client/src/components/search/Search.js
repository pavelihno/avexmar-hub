import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS } from '../../constants';
import { fetchSearchFlights } from '../../redux/actions/search';
import { formatDate } from '../utils';

const Search = () => {
        const dispatch = useDispatch();
        const { flights } = useSelector((state) => state.search);
        const [params, setParams] = useSearchParams();
        const paramObj = Object.fromEntries(params.entries());
        const paramStr = params.toString();
        const from = params.get('from');
        const to = params.get('to');
        const depart = params.get('when');
        const returnDate = params.get('return');
        const hasReturn = returnDate;

        const [sortField, setSortField] = useState(null);
        const [sortOrder, setSortOrder] = useState('asc');

        const generateNearDates = (dateStr) => {
                if (!dateStr) return [];
                const base = new Date(dateStr);
                if (isNaN(base)) return [];
                const arr = [];
                for (let i = -3; i <= 3; i++) {
                        const d = new Date(base);
                        d.setDate(base.getDate() + i);
                        arr.push(d);
                }
                return arr;
        };

        const outboundDates = useMemo(() => generateNearDates(depart), [depart]);
        const returnDatesArr = useMemo(() => generateNearDates(returnDate), [returnDate]);

        const handleDateChange = (key, value) => {
                const newParams = new URLSearchParams(paramObj);
                newParams.set(key, value);
                setParams(newParams);
        };

        const handleSort = (field) => {
                if (sortField === field) {
                        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                        setSortField(field);
                        setSortOrder('asc');
                }
        };

        const getSortValue = (g, field) => {
                const flight = g.outbound;
                switch (field) {
                        case 'price':
                                return (
                                        (g.outbound?.price || g.outbound?.min_price || 0) +
                                        (g.returnFlight?.price || g.returnFlight?.min_price || 0)
                                );
                        case 'departTime':
                                return flight?.scheduled_departure_time || '';
                        case 'departDate':
                                return flight?.scheduled_departure || '';
                        case 'arriveTime':
                                return flight?.scheduled_arrival_time || '';
                        case 'arriveDate':
                                return flight?.scheduled_arrival || '';
                        default:
                                return 0;
                }
        };

	useEffect(() => {
		dispatch(fetchSearchFlights(paramObj));
	}, [dispatch, paramStr]);

	useEffect(() => {
		document.title = UI_LABELS.SEARCH.from_to(from || '', to || '', depart, returnDate || '');
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [from, to, depart, returnDate]);

        const grouped = [];
        if (hasReturn) {
                for (let i = 0; i < flights.length; i += 2) {
                        grouped.push({ outbound: flights[i], returnFlight: flights[i + 1] });
                }
        } else {
                for (const f of flights) grouped.push({ outbound: f });
        }

        const sortedGrouped = useMemo(() => {
                if (!sortField) return grouped;
                return [...grouped].sort((a, b) => {
                        const valA = getSortValue(a, sortField);
                        const valB = getSortValue(b, sortField);
                        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                        return 0;
                });
        }, [grouped, sortField, sortOrder]);

        return (
                <Base maxWidth='xl'>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <SearchForm initialParams={paramObj} />
                        </Box>

                        {flights.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 2, px: 3, mt: 2 }}>
                                        <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, flex: 1 }}>
                                                {outboundDates.map((d) => {
                                                        const ds = formatDate(d, 'yyyy-MM-dd');
                                                        return (
                                                                <Button
                                                                        key={ds}
                                                                        variant={ds === depart ? 'contained' : 'outlined'}
                                                                        size='small'
                                                                        onClick={() => handleDateChange('when', ds)}
                                                                >
                                                                        {formatDate(d, 'dd MMM')}
                                                                </Button>
                                                        );
                                                })}
                                        </Box>
                                        {hasReturn && (
                                                <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, flex: 1 }}>
                                                        {returnDatesArr.map((d) => {
                                                                const ds = formatDate(d, 'yyyy-MM-dd');
                                                                return (
                                                                        <Button
                                                                                key={ds}
                                                                                variant={ds === returnDate ? 'contained' : 'outlined'}
                                                                                size='small'
                                                                                onClick={() => handleDateChange('return', ds)}
                                                                        >
                                                                                {formatDate(d, 'dd MMM')}
                                                                        </Button>
                                                                );
                                                        })}
                                                </Box>
                                        )}
                                </Box>
                        )}

                        <Box sx={{ p: 3 }}>
                                <Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
                                        {UI_LABELS.SEARCH.results}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        {[
                                                { field: 'price', label: UI_LABELS.SEARCH.sort.price },
                                                { field: 'departTime', label: UI_LABELS.SEARCH.sort.depart_time },
                                                { field: 'departDate', label: UI_LABELS.SEARCH.sort.depart_date },
                                                { field: 'arriveTime', label: UI_LABELS.SEARCH.sort.arrive_time },
                                                { field: 'arriveDate', label: UI_LABELS.SEARCH.sort.arrive_date },
                                        ].map((opt) => (
                                                <Button
                                                        key={opt.field}
                                                        size='small'
                                                        onClick={() => handleSort(opt.field)}
                                                        endIcon={
                                                                sortField === opt.field
                                                                        ? sortOrder === 'asc'
                                                                                ? <ArrowUpwardIcon fontSize='small' />
                                                                                : <ArrowDownwardIcon fontSize='small' />
                                                                        : null
                                                        }
                                                >
                                                        {opt.label}
                                                </Button>
                                        ))}
                                </Box>

                                {sortedGrouped && sortedGrouped.length ? (
                                        sortedGrouped.map((g, idx) => (
                                                <SearchResultCard key={idx} outbound={g.outbound} returnFlight={g.returnFlight} />
                                        ))
                                ) : (
                                        <Typography>{UI_LABELS.SEARCH.no_results}</Typography>
                                )}
                        </Box>
                </Base>
        );
};

export default Search;

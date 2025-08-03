import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import Base from '../Base';
import SearchForm from './SearchForm';
import ScheduleTable from './ScheduleTable';
import { UI_LABELS } from '../../constants';
import { fetchScheduleFlights } from '../../redux/actions/search';
import { fetchAirlines } from '../../redux/actions/airline';
import { formatDate } from '../utils';

const Schedule = () => {
        const dispatch = useDispatch();
        const { flights } = useSelector((state) => state.search);
        const { airlines } = useSelector((state) => state.airlines);
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

        const outboundFlights = useMemo(
                () => flights.filter((f) => f.direction === 'outbound'),
                [flights],
        );

        const returnFlights = useMemo(
                () => flights.filter((f) => f.direction === 'return'),
                [flights],
        );

	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
                        <Box sx={{ p: 3 }}>
                                <Typography variant='subtitle1'>
                                        {UI_LABELS.SCHEDULE.from_to(from || '', to || '')}
                                </Typography>
                                <Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
                                        {UI_LABELS.SCHEDULE.title}
                                </Typography>
                                <Typography variant='h5' sx={{ mt: 3, mb: 1 }}>
                                        {UI_LABELS.SCHEDULE.outbound}
                                </Typography>
                                {outboundFlights.length ? (
                                        <ScheduleTable flights={outboundFlights} airlines={airlines} />
                                ) : (
                                        <Typography>{UI_LABELS.SCHEDULE.no_results}</Typography>
                                )}
                                <Typography variant='h5' sx={{ mt: 4, mb: 1 }}>
                                        {UI_LABELS.SCHEDULE.return}
                                </Typography>
                                {returnFlights.length ? (
                                        <ScheduleTable flights={returnFlights} airlines={airlines} />
                                ) : (
                                        <Typography>{UI_LABELS.SCHEDULE.no_results}</Typography>
                                )}
                        </Box>
                </Base>
        );
};

export default Schedule;

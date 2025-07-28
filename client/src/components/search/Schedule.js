import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS } from '../../constants';
import { fetchSearchFlights } from '../../redux/actions/search';
import { formatDate } from '../utils';

const Schedule = () => {
	const dispatch = useDispatch();
	const { flights } = useSelector((state) => state.search);
	const [params] = useSearchParams();
	const paramObj = Object.fromEntries(params.entries());
	const paramStr = params.toString();
	const from = params.get('from');
	const to = params.get('to');

	useEffect(() => {
		if (from && to) {
			const p = { ...paramObj };
			if (!p.when_from) {
				const today = new Date();
				const end = new Date();
				end.setDate(today.getDate() + 365);
				p.when_from = formatDate(today, 'yyyy-MM-dd');
				p.when_to = formatDate(end, 'yyyy-MM-dd');
			}
			dispatch(fetchSearchFlights(p));
		}
	}, [dispatch, paramStr, from, to]);

	useEffect(() => {
		document.title = UI_LABELS.SCHEDULE.from_to(from || '', to || '');
		return () => {
			document.title = UI_LABELS.APP_TITLE;
		};
	}, [from, to]);

	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SCHEDULE.title}
				</Typography>
				{flights && flights.length ? (
					flights.map((f) => <SearchResultCard key={f.id} outbound={f} />)
				) : (
					<Typography>{UI_LABELS.SCHEDULE.no_results}</Typography>
				)}
			</Box>
		</Base>
	);
};

export default Schedule;

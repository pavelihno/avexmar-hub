import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import Base from '../Base';
import SearchForm from './SearchForm';
import SearchResultCard from './SearchResultCard';
import { UI_LABELS } from '../../constants';
import { fetchSearchFlights } from '../../redux/actions/search';

const Search = () => {
	const dispatch = useDispatch();
	const { flights } = useSelector((state) => state.search);
	const [params] = useSearchParams();
	const paramObj = Object.fromEntries(params.entries());
	const paramStr = params.toString();
	const from = params.get('from');
	const to = params.get('to');
	const depart = params.get('when');
	const returnDate = params.get('return');
	const hasReturn = returnDate;

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

	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm initialParams={paramObj} />
			</Box>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' component='h1' gutterBottom sx={{ mt: 3 }}>
					{UI_LABELS.SEARCH.results}
				</Typography>
				{grouped && grouped.length ? (
					grouped.map((g, idx) => (
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

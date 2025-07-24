import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper } from '@mui/material';
import Base from '../Base';
import { UI_LABELS } from '../../constants';
import { fetchSearchFlights } from '../../redux/actions/search';

const Search = () => {
        const dispatch = useDispatch();
        const { flights } = useSelector((state) => state.search);
        const [params] = useSearchParams();
        const from = params.get('from');
        const to = params.get('to');

        useEffect(() => {
                dispatch(fetchSearchFlights());
        }, [dispatch]);

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Typography variant='h5' gutterBottom>
					{UI_LABELS.SEARCH.results}
				</Typography>
				<Typography variant='subtitle1' gutterBottom>
					{from && to ? UI_LABELS.SEARCH.from_to(from, to) : ''}
				</Typography>
                                {flights && flights.length ? (
                                        flights.map((f) => (
                                                <Paper key={f.id} sx={{ p: 2, mb: 2 }}>
                                                        <Typography variant='h6'>{f.airline || f.airline_id}</Typography>
                                                        <Typography>{`${f.from || f.origin} - ${f.to || f.destination}`}</Typography>
                                                        <Typography>{`${f.departure || f.scheduled_departure} - ${f.arrival || f.scheduled_arrival}`}</Typography>
                                                        <Typography>
                                                                {UI_LABELS.SEARCH.flight_details.price}: {f.price}
                                                        </Typography>
                                                </Paper>
                                        ))
                                ) : (
                                        <Typography>{UI_LABELS.SEARCH.no_results}</Typography>
                                )}
			</Box>
		</Base>
	);
};

export default Search;

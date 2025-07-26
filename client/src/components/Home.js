import React from 'react';
import { Box, Typography } from '@mui/material';
import Base from './Base';
import SearchForm from './search/SearchForm';
import { UI_LABELS } from '../constants';

const Home = () => {
	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<SearchForm />
			</Box>
			<Box sx={{ mt: 5 }}>
				<Typography variant='h4' component='h1'>
					{UI_LABELS.HOME.schedule.title}
				</Typography>
			</Box>
		</Base>
	);
};

export default Home;

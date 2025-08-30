import React from 'react';
import { Box } from '@mui/material';
import Base from './Base';
import SearchForm from './search/SearchForm';

const Home = () => {
	return (
		<Base maxWidth='xl'>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ width: '100%', px: { xs: 1, sm: 2 } }}>
					<SearchForm loadLocalStorage />
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

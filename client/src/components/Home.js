import React from 'react';
import { Box } from '@mui/material';
import Base from './Base';
import SearchForm from './search/SearchForm';

const Home = () => {
	return (
		<Base maxWidth='xl'>
			<Box
				sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
			>
				<Box maxWidth={{ xs: '100%', sm: 500 }} sx={{ width: '100%' }}>
					<SearchForm loadLocalStorage={true} />
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

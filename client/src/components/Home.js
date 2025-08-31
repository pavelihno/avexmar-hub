import React from 'react';
import { Box } from '@mui/material';
import Base from './Base';
import SearchForm from './search/SearchForm';
import PosterCarousel from './home/PosterCarousel';

const Home = () => {
	return (
		<Base>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 2,
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<SearchForm loadLocalStorage />
				</Box>
				<Box sx={{ width: '100%', flex: 1, mt: { xs: 2, md: 0 } }}>
					{/* <PosterCarousel /> */}
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

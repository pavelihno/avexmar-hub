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
				<Box
					sx={{
						width: { xs: '100%', md: '80%' },
						mt: { xs: 4, md: 6 },
						mx: 'auto',
					}}
				>
					<PosterCarousel />
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

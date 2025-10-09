import React from 'react';
import { Box } from '@mui/material';
import Base from './Base';
import SearchForm from './search/SearchForm';
import PosterCarousel from './home/PosterCarousel';
import RecommendationsShowcase from './home/RecommendationsShowcase';

const Home = () => {
	return (
		<Base>
			<Box
				component='main'
				sx={{
					display: 'flex',
					flexDirection: 'column',
					mb: { xs: 2, sm: 3 },
					gap: { xs: 3, sm: 3.5, md: 4 },
				}}
			>
				<Box component='section' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<SearchForm loadLocalStorage />
				</Box>
				<Box component='section'>
					<PosterCarousel />
				</Box>
				<Box component='section'>
					<RecommendationsShowcase />
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

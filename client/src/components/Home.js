import React from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';

import Base from './Base';

const Home = () => {
	const dispatch = useDispatch();

	return (
		<Base>
			<Box sx={{ p: 3 }} />
		</Base>
	);
};

export default Home;

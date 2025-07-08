import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

import Header from './Header';
import Footer from './Footer';

import { pageTransition } from '../theme/animations';

const Base = ({ children }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return (
		<Box>
			<CssBaseline />
			<Container
				sx={{
					minHeight: '100vh',
					bgcolor: 'background.default',
					color: 'text.primary',
				}}
				maxWidth='lg'
			>
				<Header />
				<motion.div
					initial={pageTransition.initial}
					animate={pageTransition.animate}
					exit={pageTransition.exit}
					transition={pageTransition.transition}
				>
					{children}
				</motion.div>
			</Container>
			<Footer />
		</Box>
	);
};

export default Base;

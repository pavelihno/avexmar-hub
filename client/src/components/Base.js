import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import theme from '../theme';
import { pageTransition } from '../theme/animations';
import Header from './Header';

const Base = ({ children }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Container
				sx={{
					minHeight: '100vh',
					bgcolor: 'background.default',
					color: 'text.primary',
				}}
				maxWidth='lg'
			>
				<Header/>
				<motion.div
					initial={pageTransition.initial}
					animate={pageTransition.animate}
					exit={pageTransition.exit}
					transition={pageTransition.transition}
				>
					{children}
				</motion.div>
			</Container>
		</ThemeProvider>
	);
};

export default Base;

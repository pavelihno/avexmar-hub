import React from 'react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

import theme from '../theme';
import { pageTransition } from '../theme/animations';

const Base = ({ children }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return (
		<ThemeProvider theme={theme}>
			<Container
				sx={{
					minHeight: '100vh',
					bgcolor: 'background.default',
					color: 'text.primary',
				}}
				maxWidth='lg'
			>
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

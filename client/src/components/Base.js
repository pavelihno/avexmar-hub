import React from 'react';
import { motion } from 'framer-motion';

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

import Header from './Header';
import Footer from './Footer';

import { pageTransition } from '../theme/animations';

const Base = ({ children }) => {
	return (
		<Box>
			<CssBaseline />
			<Container
				maxWidth={false}
				sx={{
					minHeight: '100vh',
					bgcolor: 'background.default',
					color: 'text.primary',
					maxWidth: { xs: '100%', sm: 'sm', md: 'md', lg: 'lg' },
					py: { xs: 1, md: 2 },
					mx: { xs: 0, sm: 'auto' },
				}}
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

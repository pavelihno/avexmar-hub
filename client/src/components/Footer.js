import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Container, Typography, Link, Stack } from '@mui/material';

import { UI_LABELS } from '../constants';

const Footer = () => {
	const companyName = UI_LABELS.ABOUT.company_name;
	const currentYear = new Date().getFullYear();

	const links = [
		{ to: '/privacy_policy', label: UI_LABELS.ABOUT.privacy_policy_agreement },
		{ to: '/public_offer', label: UI_LABELS.ABOUT.public_offer },
		{ to: '/about', label: UI_LABELS.ABOUT.about_us },
	];

	return (
		<Box
			component='footer'
			sx={{
				py: 3,
				mt: 'auto',
				bgcolor: 'background.paper',
				borderTop: 1,
				borderColor: 'divider',
			}}
		>
			<Container maxWidth='lg' sx={{ px: { xs: 3, sm: 4 } }}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					justifyContent='space-between'
					alignItems='center'
					spacing={3}
				>
					<Stack>
						<Typography variant='body2' color='text.secondary' align='center'>
							© {currentYear}, {companyName}. {UI_LABELS.ABOUT.all_rights_reserved}
						</Typography>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems='center'>
						{links.map(({ to, label }) => (
							<Link
								key={to}
								to={to}
								component={RouterLink}
								color='inherit'
								underline='hover'
								sx={{ px: 1 }}
							>
								<Typography variant='body2'>{label}</Typography>
							</Link>
						))}
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
};

export default Footer;

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Container, Typography, Link, Stack } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import { UI_LABELS } from '../constants';

const Footer = () => {
	const companyName = process.env.REACT_APP_COMPANY_NAME;
	const currentYear = new Date().getFullYear();
	const contactEmail = process.env.REACT_APP_CONTACT_EMAIL;

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
						<Typography
							variant='body2'
							color='text.secondary'
							align='center'
						>
							© {currentYear}, {companyName}.{' '}
							{UI_LABELS.ABOUT.all_rights_reserved}
						</Typography>
					</Stack>

					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={{ xs: 2, sm: 3 }}
						alignItems='center'
					>
						<Link
							component={RouterLink}
							to='/about'
							color='inherit'
							underline='hover'
							sx={{ px: 1 }}
						>
							{UI_LABELS.ABOUT.about_us}
						</Link>
						<Link
							href={`mailto:${contactEmail}`}
							color='inherit'
							underline='hover'
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								px: 1,
							}}
						>
							{contactEmail}
							<MailOutlineIcon fontSize='small' />
						</Link>
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
};

export default Footer;

import React, { useState } from 'react';

import { Typography, Box, Container, Paper, Link, Avatar, IconButton, Tooltip, Snackbar, Grid } from '@mui/material';
import { ArrowForward, ContentCopy } from '@mui/icons-material';
import Base from './Base';
import { UI_LABELS } from '../constants/uiLabels';

const aboutLinks = [
	{ href: '/privacy_policy', label: UI_LABELS.ABOUT.privacy_policy_agreement },
	{ href: '/public_offer', label: UI_LABELS.ABOUT.public_offer },
	// { href: '/marketing_consent', label: UI_LABELS.ABOUT.marketing_consent },
];

const About = () => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');

	const cardsData = UI_LABELS.ABOUT.cards.map((card, _) => ({
		...card,
		icon: `images/icons/${card.icon}.svg`,
	}));

        const companyDescription = UI_LABELS.ABOUT.company_description;

        const companyName = UI_LABELS.ABOUT.company_name;

        const companyDetails = [
                { label: UI_LABELS.ABOUT.full_name, value: UI_LABELS.ABOUT.company_full_name },
                { label: UI_LABELS.ABOUT.ogrn, value: UI_LABELS.ABOUT.ogrn_value },
                { label: UI_LABELS.ABOUT.inn, value: UI_LABELS.ABOUT.inn_value },
                {
                        label: UI_LABELS.ABOUT.legal_address,
                        value: UI_LABELS.ABOUT.legal_address_value,
                },
                {
                        label: UI_LABELS.ABOUT.phone,
                        value: UI_LABELS.ABOUT.contact_phone,
                        href: `tel:${UI_LABELS.ABOUT.contact_phone}`,
                },
                {
                        label: UI_LABELS.ABOUT.email,
                        value: UI_LABELS.ABOUT.contact_email,
                        href: `mailto:${UI_LABELS.ABOUT.contact_email}`,
                },
        ];

	const handleCopy = (text, type) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setSnackbarMessage(`${type} ${UI_LABELS.ABOUT.copied.toLowerCase()}`);
				setSnackbarOpen(true);
			})
			.catch((err) => {
				console.error(`${UI_LABELS.ERRORS.copy}: ${err}`);
			});
	};

	const handleCloseSnackbar = () => {
		setSnackbarOpen(false);
	};

	return (
		<Base>
			<Container maxWidth='lg' sx={{ py: 4 }}>
				<Box mb={4} textAlign='center'>
					<Typography variant='h4' component='h1' gutterBottom>
						{companyName}
					</Typography>
					<Typography variant='subtitle1' color='text.secondary'>
						{companyDescription}
					</Typography>
				</Box>

				<Box mb={5}>
					{cardsData.map((card, index) => (
						<Paper
							key={index}
							elevation={1}
							sx={{
								mb: 2,
								overflow: 'hidden',
								transition: 'all 0.2s',
								'&:hover': { boxShadow: 3 },
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Box
									sx={{
										p: 2,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										minWidth: { xs: 70, sm: 100 },
									}}
								>
									<Avatar
										src={card.icon}
										alt={card.alt}
										sx={{
											width: { xs: 40, sm: 60 },
											height: { xs: 40, sm: 60 },
											p: 1,
										}}
									/>
								</Box>
								<Box sx={{ p: 2, flexGrow: 1 }}>
									<Typography
										variant='h6'
										component='h3'
										gutterBottom
										sx={{
											fontWeight: 'medium',
											fontSize: {
												xs: '1rem',
												sm: '1.25rem',
											},
										}}
									>
										{card.title}
									</Typography>
									<Typography variant='body2' color='text.secondary' sx={{ overflow: 'hidden' }}>
										{card.content}
									</Typography>
								</Box>
							</Box>
						</Paper>
					))}
				</Box>

                                <Box mb={4}>
                                        <Typography variant='h4' component='h2' gutterBottom>
                                                {UI_LABELS.ABOUT.company_details}
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2 }}>
                                                {companyDetails.map(({ label, value, href }, index) => (
                                                        <Box
                                                                key={index}
                                                                sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        py: 1,
                                                                }}
                                                        >
                                                                <Typography
                                                                        variant='subtitle2'
                                                                        color='text.secondary'
                                                                        sx={{ minWidth: { xs: 'auto', sm: 220 }, mr: 1 }}
                                                                >
                                                                        {label}
                                                                </Typography>
                                                                {href ? (
                                                                        <Link
                                                                                href={href}
                                                                                variant='body2'
                                                                                sx={{
                                                                                        mr: 1,
                                                                                        textDecoration: 'none',
                                                                                        color: 'text.primary',
                                                                                        '&:hover': {
                                                                                                textDecoration: 'underline',
                                                                                                color: 'primary.main',
                                                                                        },
                                                                                }}
                                                                        >
                                                                                {value}
                                                                        </Link>
                                                                ) : (
                                                                        <Typography variant='body2' sx={{ mr: 1 }}>
                                                                                {value}
                                                                        </Typography>
                                                                )}
                                                                <Tooltip title={UI_LABELS.BUTTONS.copy}>
                                                                        <IconButton
                                                                                size='small'
                                                                                onClick={() => handleCopy(value, label)}
                                                                                aria-label={`${UI_LABELS.BUTTONS.copy} ${label}`}
                                                                        >
                                                                                <ContentCopy fontSize='small' />
                                                                        </IconButton>
                                                                </Tooltip>
                                                        </Box>
                                                ))}
                                        </Paper>
                                </Box>

				<Box mb={4}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.legal_info}
					</Typography>

					<Paper elevation={1} sx={{ p: 2 }}>
						<Grid container spacing={2} wrap='nowrap'>
							{aboutLinks.map(({ href, label }) => (
								<Grid item xs key={href}>
									<Box
										component={Link}
										href={href}
										sx={{
											display: 'flex',
											alignItems: 'center',
											p: 1,
											borderRadius: 1,
											bgcolor: 'action.hover',
											textDecoration: 'none',
											color: 'text.primary',
											'&:hover': { bgcolor: 'action.selected' },
										}}
									>
										<ArrowForward fontSize='small' sx={{ mr: 1 }} />
										<Typography variant='body2'>{label}</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					</Paper>
				</Box>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={2000}
					onClose={handleCloseSnackbar}
					message={snackbarMessage}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				/>
			</Container>
		</Base>
	);
};

export default About;

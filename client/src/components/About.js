import React, { useState } from 'react';

import {
	Typography,
	Grid,
	Box,
	Container,
	Paper,
	Link,
	Avatar,
	IconButton,
	Tooltip,
	Snackbar,
} from '@mui/material';
import {
	LocationOn,
	Phone,
	Email,
	ArrowForward,
	ContentCopy,
} from '@mui/icons-material';
import Base from './Base';
import { UI_LABELS } from '../constants/uiLabels';

const About = () => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');

	const cardsData = UI_LABELS.ABOUT.cards.map((card, _) => ({
		...card,
		icon: `images/icons/${card.icon}.svg`,
	}));

	const companyDescription = UI_LABELS.ABOUT.company_description;

	const contactInfo = {
		address: process.env.REACT_APP_ADDRESS,
		phone: process.env.REACT_APP_CONTACT_PHONE,
		email: process.env.REACT_APP_CONTACT_EMAIL,
	};

	const companyName = process.env.REACT_APP_COMPANY_NAME;

	const handleCopy = (text, type) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setSnackbarMessage(
					`${type} ${UI_LABELS.ABOUT.copied.toLowerCase()}`
				);
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
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ overflow: 'hidden' }}
									>
										{card.content}
									</Typography>
								</Box>
							</Box>
						</Paper>
					))}
				</Box>

				<Box mb={4}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.contact_info}
					</Typography>
					<Paper elevation={1} sx={{ p: 2 }}>
						<Grid container alignItems='center'>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<LocationOn color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										{UI_LABELS.ABOUT.address}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Typography
											variant='body2'
											sx={{ mr: 1 }}
										>
											{contactInfo.address}
										</Typography>
										<Tooltip title={UI_LABELS.BUTTONS.copy}>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.address,
														UI_LABELS.ABOUT.address
													)
												}
												aria-label={`${UI_LABELS.BUTTONS.copy} ${UI_LABELS.ABOUT.address}`}
											>
												<ContentCopy fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<Phone color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										{UI_LABELS.ABOUT.phone}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Link
											href={`tel:${contactInfo.phone}`}
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
											{contactInfo.phone}
										</Link>
										<Tooltip title={UI_LABELS.BUTTONS.copy}>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.phone,
														UI_LABELS.ABOUT.phone
													)
												}
												aria-label={`${UI_LABELS.BUTTONS.copy} ${UI_LABELS.ABOUT.phone}`}
											>
												<ContentCopy fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1,
								}}
							>
								<Email color='primary' sx={{ mr: 2 }} />
								<Box sx={{ flexGrow: 1 }}>
									<Typography
										variant='subtitle2'
										color='text.secondary'
									>
										{UI_LABELS.ABOUT.email}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<Link
											href={`mailto:${contactInfo.email}`}
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
											{contactInfo.email}
										</Link>
										<Tooltip title={UI_LABELS.BUTTONS.copy}>
											<IconButton
												size='small'
												onClick={() =>
													handleCopy(
														contactInfo.email,
														UI_LABELS.ABOUT
															.email_address
													)
												}
												aria-label={`${UI_LABELS.BUTTONS.copy} ${UI_LABELS.ABOUT.email_address}`}
											>
												<ContentCopy fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Grid>
						</Grid>
					</Paper>
				</Box>

				<Box mb={4}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.legal_info}
					</Typography>
					<Paper elevation={1} sx={{ p: 2 }}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<Box
									component={Link}
									href='/privacy_policy'
									sx={{
										display: 'flex',
										alignItems: 'center',
										p: 1,
										borderRadius: 1,
										bgcolor: 'action.hover',
										textDecoration: 'none',
										color: 'text.primary',
										'&:hover': {
											bgcolor: 'action.selected',
										},
									}}
								>
									<ArrowForward
										fontSize='small'
										sx={{ mr: 1 }}
									/>
									<Typography variant='body2'>
										{
											UI_LABELS.ABOUT
												.privacy_policy_agreement
										}
									</Typography>
								</Box>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Box
									component={Link}
									href='/marketing_consent'
									sx={{
										display: 'flex',
										alignItems: 'center',
										p: 1,
										borderRadius: 1,
										bgcolor: 'action.hover',
										textDecoration: 'none',
										color: 'text.primary',
										'&:hover': {
											bgcolor: 'action.selected',
										},
									}}
								>
									<ArrowForward
										fontSize='small'
										sx={{ mr: 1 }}
									/>
									<Typography variant='body2'>
										{UI_LABELS.ABOUT.marketing_consent}
									</Typography>
								</Box>
							</Grid>
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

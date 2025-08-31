import React, { useState } from 'react';

import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Paper,
	Link,
	IconButton,
	Tooltip,
	Typography,
	Box,
	Container,
	Avatar,
	Snackbar,
	Grid,
	List,
	ListItem,
	useMediaQuery,
	Card,
	CardContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowForward, ContentCopy } from '@mui/icons-material';
import Base from './Base';
import { UI_LABELS } from '../constants/uiLabels';

const aboutLinks = [
	{
		href: '/privacy_policy',
		label: UI_LABELS.ABOUT.privacy_policy_agreement,
	},
	{ href: '/public_offer', label: UI_LABELS.ABOUT.public_offer },
	// { href: '/marketing_consent', label: UI_LABELS.ABOUT.marketing_consent },
];

const About = () => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);

	const cardsData = UI_LABELS.ABOUT.cards.map((card, _) => ({
		...card,
		icon: `images/icons/${card.icon}.svg`,
	}));

	const companyDescription = UI_LABELS.ABOUT.company_description;

	const companyName = UI_LABELS.ABOUT.company_name;

	const companyDetails = [
		{
			label: UI_LABELS.ABOUT.full_name,
			value: UI_LABELS.ABOUT.company_full_name,
		},
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
			label: UI_LABELS.ABOUT.email_address,
			value: UI_LABELS.ABOUT.contact_email,
			href: `mailto:${UI_LABELS.ABOUT.contact_email}`,
		},
	];

	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	const handleCopy = (text, type) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
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
			<Container maxWidth='lg' sx={{ py: { xs: 3, sm: 4 } }}>
				<Box mb={{ xs: 3, sm: 4 }} textAlign='center'>
					<Typography variant='h4' component='h1' gutterBottom>
						{companyName}
					</Typography>
					<Typography variant='subtitle1' color='text.secondary'>
						{companyDescription}
					</Typography>
				</Box>

				<Box mb={{ xs: 4, sm: 5 }}>
					<Grid container spacing={{ xs: 2, sm: 3 }}>
						{cardsData.map((card, index) => (
							<Grid item xs={12} sm={6} md={4} key={index}>
								<Card
									variant='outlined'
									sx={{
										position: 'relative',
										borderRadius: 3,
										display: 'flex',
										flexDirection: 'column',
										height: '100%',
										p: 0.5,
									}}
								>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'flex-start',
											height: '100%',
											px: { xs: 2.5, sm: 3 },
											pt: { xs: 4, sm: 5 },
											pb: { xs: 3, sm: 4 },
										}}
									>
										<Avatar
											src={card.icon}
											alt={card.alt}
											sx={{
												width: { xs: 64, sm: 72 },
												height: { xs: 64, sm: 72 },
												mb: { xs: 2, sm: 2.5 },
												p: 1.5,
											}}
										/>
										<CardContent
											sx={{
												p: 0,
												textAlign: 'center',
												display: 'flex',
												flexDirection: 'column',
												flexGrow: 1,
											}}
										>
											<Typography
												variant='h6'
												component='h3'
												gutterBottom
												sx={{
													fontWeight: 600,
													letterSpacing: 0.3,
												}}
											>
												{card.title}
											</Typography>
											<Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1 }}>
												{card.content}
											</Typography>
										</CardContent>
									</Box>
								</Card>
							</Grid>
						))}
					</Grid>
				</Box>

				<Box mb={{ xs: 3, sm: 4 }}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.company_details}
					</Typography>
					{isXs ? (
						<List disablePadding>
							{companyDetails.map(({ label, value, href }, index) => (
								<ListItem
									key={index}
									disableGutters
									sx={{
										flexDirection: 'column',
										alignItems: 'flex-start',
										py: 1,
									}}
								>
									<Typography variant='subtitle2' color='text.secondary' sx={{ fontWeight: 'bold' }}>
										{label}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											width: '100%',
											justifyContent: 'space-between',
										}}
									>
										{href ? (
											<Link
												href={href}
												variant='body2'
												sx={{
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
											<Typography variant='body2'>{value}</Typography>
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
								</ListItem>
							))}
						</List>
					) : (
						<TableContainer component={Paper} elevation={1} sx={{ p: 2 }}>
							<Table size='small'>
								<TableBody>
									{companyDetails.map(({ label, value, href }, index) => (
										<TableRow key={index}>
											<TableCell>
												<Typography
													variant='subtitle2'
													color='text.secondary'
													sx={{
														fontWeight: 'bold',
													}}
												>
													{label}
												</Typography>
											</TableCell>
											<TableCell>
												{href ? (
													<Link
														href={href}
														variant='body2'
														sx={{
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
													<Typography variant='body2'>{value}</Typography>
												)}
											</TableCell>
											<TableCell align='right' sx={{ width: 40 }}>
												<Tooltip title={UI_LABELS.BUTTONS.copy}>
													<IconButton
														size='small'
														onClick={() => handleCopy(value, label)}
														aria-label={`${UI_LABELS.BUTTONS.copy} ${label}`}
													>
														<ContentCopy fontSize='small' />
													</IconButton>
												</Tooltip>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Box>

				<Box mb={{ xs: 3, sm: 4 }}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.legal_info}
					</Typography>

					<Paper elevation={1} sx={{ p: 2 }}>
						<Box
							sx={{
								display: 'grid',
								gap: 2,
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(auto-fit, minmax(200px, 1fr))',
									md: `repeat(${Math.min(aboutLinks.length, 3)}, 1fr)`,
								},
								alignItems: 'start', // prevent vertical stretching
							}}
						>
							{aboutLinks.map(({ href, label }) => (
								<Box
									key={href}
									component={Link}
									href={href}
									sx={{
										position: 'relative',
										display: 'flex',
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'flex-start',
										gap: 1,
										p: 2,
										borderRadius: 2,
										bgcolor: 'action.hover',
										textDecoration: 'none',
										color: 'text.primary',
										'&:hover': { bgcolor: 'action.selected' },
									}}
								>
									<ArrowForward fontSize='small' />
									<Typography variant='body2' sx={{ fontWeight: 500, textAlign: 'left' }}>
										{label}
									</Typography>
								</Box>
							))}
						</Box>
					</Paper>
				</Box>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={2000}
					onClose={handleCloseSnackbar}
					message={UI_LABELS.ABOUT.copied}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				/>
			</Container>
		</Base>
	);
};

export default About;

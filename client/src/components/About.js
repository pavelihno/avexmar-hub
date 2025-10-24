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
	Grid2,
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
		href: '/pd_policy',
		label: UI_LABELS.ABOUT.pd_policy,
	},
	{
		href: '/pd_agreement',
		label: UI_LABELS.ABOUT.pd_agreement,
	},
	{ href: '/public_offer', label: UI_LABELS.ABOUT.public_offer },
];

const About = () => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);

	const cardsData = UI_LABELS.ABOUT.cards;

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
					<Grid2 container spacing={{ xs: 2, sm: 3, md: 3 }}>
						{cardsData.map((card, index) => (
							<Grid2
								key={index}
								size={{
									xs: 12,
									sm: 6,
									md: 4,
								}}
							>
								<Card
									elevation={0}
									sx={{
										height: '100%',
										borderRadius: 3,
										border: '1px solid',
										borderColor: 'divider',
										background: (theme) =>
											theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
										transition: 'all 0.3s ease-in-out',
										position: 'relative',
										overflow: 'hidden',
										'&::before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '3px',
											background: (theme) =>
												`linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
											transform: 'scaleX(0)',
											transformOrigin: 'left',
											transition: 'transform 0.3s ease-in-out',
										},
										'&:hover': {
											transform: 'translateY(-6px)',
											borderColor: 'primary.main',
											boxShadow: (theme) =>
												theme.palette.mode === 'dark'
													? '0 16px 32px rgba(0, 0, 0, 0.5)'
													: '0 16px 32px rgba(0, 0, 0, 0.1)',
											'&::before': {
												transform: 'scaleX(1)',
											},
											'& .card-icon': {
												transform: 'scale(1.1) rotate(5deg)',
												filter: (theme) =>
													theme.palette.mode === 'dark'
														? 'brightness(1.2)'
														: 'brightness(1.1)',
											},
										},
									}}
								>
									<CardContent
										sx={{
											p: { xs: 2.5, sm: 3 },
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												mb: 2,
											}}
										>
											<Box
												className='card-icon'
												sx={{
													width: 48,
													height: 48,
													borderRadius: 2,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													background: (theme) =>
														theme.palette.mode === 'dark'
															? 'rgba(33, 150, 243, 0.15)'
															: 'rgba(33, 150, 243, 0.08)',
													transition: 'all 0.3s ease-in-out',
												}}
											>
												<Avatar
													src={`images/icons/${card.icon}.svg`}
													alt={card.alt}
													sx={{
														width: 28,
														height: 28,
														bgcolor: 'transparent',
													}}
												/>
											</Box>
										</Box>

										<Typography
											variant='h6'
											component='h3'
											sx={{
												fontWeight: 700,
												fontSize: { xs: '1rem', sm: '1.1rem' },
												lineHeight: 1.4,
												mb: 1.5,
												color: 'text.primary',
											}}
										>
											{card.title}
										</Typography>

										<Typography
											variant='body2'
											color='text.secondary'
											sx={{
												lineHeight: 1.7,
												fontSize: { xs: '0.875rem', sm: '0.9rem' },
												flexGrow: 1,
											}}
										>
											{card.content}
										</Typography>
									</CardContent>
								</Card>
							</Grid2>
						))}
					</Grid2>
				</Box>

				<Box mb={{ xs: 3, sm: 4 }}>
					<Typography variant='h4' component='h2' gutterBottom>
						{UI_LABELS.ABOUT.company_details}
					</Typography>
					{isXs ? (
						<Paper elevation={1} sx={{ p: 2 }}>
							<List dense disablePadding>
								{companyDetails.map(({ label, value, href }, index) => (
									<ListItem
										key={index}
										disableGutters
										sx={{
											display: 'flex',
											alignItems: 'flex-start',
											py: 1,
											px: 0,
											borderBottom: index !== companyDetails.length - 1 ? '1px solid' : 'none',
											borderColor: 'divider',
											gap: 1.5,
										}}
									>
										<Box sx={{ flexGrow: 1, minWidth: 0 }}>
											<Typography
												variant='subtitle2'
												color='text.secondary'
												sx={{ fontWeight: 'bold', mb: 0.25 }}
											>
												{label}
											</Typography>
											{href ? (
												<Link
													href={href}
													variant='body2'
													sx={{
														textDecoration: 'none',
														color: 'text.primary',
														wordBreak: 'break-word',
														'&:hover': {
															textDecoration: 'underline',
															color: 'primary.main',
														},
													}}
												>
													{value}
												</Link>
											) : (
												<Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
													{value}
												</Typography>
											)}
										</Box>
										<IconButton
											size='small'
											onClick={() => handleCopy(value, label)}
											aria-label={`${UI_LABELS.BUTTONS.copy} ${label}`}
											edge='end'
										>
											<ContentCopy fontSize='small' />
										</IconButton>
									</ListItem>
								))}
							</List>
						</Paper>
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
												<IconButton
													size='small'
													onClick={() => handleCopy(value, label)}
													aria-label={`${UI_LABELS.BUTTONS.copy} ${label}`}
												>
													<ContentCopy fontSize='small' />
												</IconButton>
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

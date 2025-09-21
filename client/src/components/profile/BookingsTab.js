import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	Typography,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TableContainer,
	Paper,
	Box,
	Container,
	Chip,
	Button,
	IconButton,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { fetchUserBookings } from '../../redux/actions/booking';
import { UI_LABELS } from '../../constants/uiLabels';
import { ENUM_LABELS } from '../../constants/enumLabels';

const BookingsTab = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state) => state.auth.currentUser);
	const { bookings, isLoading } = useSelector((state) => state.bookings);

	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		if (currentUser?.id) {
			dispatch(fetchUserBookings(currentUser.id));
		}
	}, [dispatch, currentUser]);

	const rows = useMemo(() => {
		return (bookings || []).map((b) => {
			const flights = b.flights || [];
			const segments = flights.slice(0, 2).map((f) => UI_LABELS.PROFILE.segmentBuilder(f));

			const linkBase = window.location.origin;
			const link = `${linkBase}/booking/${b.public_id}`;

			return {
				id: b.id,
				bookingNumber: b.booking_number,
				segments,
				passengersCount: b.passengers_count,
				link,
				status: b.status,
				showLink: b.show_link,
			};
		});
	}, [bookings]);

	if (isLoading) {
		return <Typography>{UI_LABELS.MESSAGES.loading}</Typography>;
	}

	return (
		<Container maxWidth='md' sx={{ mt: { xs: 2, md: 4 }, px: { xs: 0, md: 2 } }}>
			<Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
				<Typography variant='h4'>{UI_LABELS.PROFILE.bookings}</Typography>

				{(!bookings || bookings.length === 0) && (
					<Typography variant='subtitle1' sx={{ textAlign: 'center', mt: 2 }}>
						{UI_LABELS.PROFILE.no_bookings}
					</Typography>
				)}

				{bookings && bookings.length > 0 && (
					<>
						{isXs ? (
							// Mobile card view
							<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
								{rows.map((row) => (
									<Paper key={row.id} variant='outlined' sx={{ p: 1.5 }}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 1,
												mb: 0.5,
												flexWrap: 'wrap',
											}}
										>
											<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
												{row.bookingNumber || '—'}
											</Typography>
											<Chip
												size='small'
												label={ENUM_LABELS.BOOKING_STATUS[row.status] || row.status}
											/>
										</Box>

										{row.segments && row.segments.length ? (
											<Box sx={{ mt: 0.25 }}>
												{row.segments.map((s, idx) => (
													<Box key={s.key || idx} sx={{ ...(idx > 0 ? { mt: 0.75 } : {}) }}>
														<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
															{s.routeText || '—'}
														</Typography>
														{s.timeText && (
															<Typography variant='caption' color='text.secondary'>
																{s.timeText}
															</Typography>
														)}
													</Box>
												))}
											</Box>
										) : (
											<Typography variant='body2' noWrap sx={{ color: 'text.secondary' }}>
												—
											</Typography>
										)}

										<Box
											sx={{
												mt: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Typography variant='caption' sx={{ color: 'text.secondary' }}>
												<span style={{ textDecoration: 'underline' }}>
													{UI_LABELS.PROFILE.passengers}:
												</span>{' '}
												{row.passengersCount || 0}
											</Typography>
											{row.showLink && (
												<IconButton
													component='a'
													href={row.link}
													target='_blank'
													rel='noopener noreferrer'
													aria-label={UI_LABELS.PROFILE.open_link}
													size='small'
												>
													<OpenInNewIcon fontSize='small' />
												</IconButton>
											)}
										</Box>
									</Paper>
								))}
							</Box>
						) : (
							// Desktop table view
							<TableContainer sx={{ mt: 2, overflowX: 'auto' }}>
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell
												sx={{
													fontWeight: 'bold',
													width: {
														xs: '28%',
														sm: '22%',
														md: '20%',
													},
												}}
											>
												{UI_LABELS.PROFILE.booking_number}
											</TableCell>
											<TableCell
												sx={{
													fontWeight: 'bold',
													width: {
														xs: '44%',
														sm: '56%',
														md: '60%',
													},
												}}
											>
												{UI_LABELS.PROFILE.route}
											</TableCell>
											<TableCell
												align='center'
												sx={{
													fontWeight: 'bold',
													width: {
														xs: '12%',
														sm: '10%',
														md: '8%',
													},
												}}
											>
												{UI_LABELS.PROFILE.passengers}
											</TableCell>
											<TableCell />
										</TableRow>
									</TableHead>
									<TableBody>
										{rows.map((row) => (
											<TableRow key={row.id}>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>
													<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
														{row.bookingNumber || '—'}
													</Typography>
													<Box sx={{ mt: 0.5 }}>
														<Chip
															size='small'
															label={ENUM_LABELS.BOOKING_STATUS[row.status] || row.status}
														/>
													</Box>
												</TableCell>
												<TableCell>
													{row.segments && row.segments.length ? (
														<Box>
															{row.segments.map((s) => (
																<Box key={s.key} sx={{ mb: 0.5 }}>
																	<Typography
																		variant='subtitle2'
																		sx={{ fontWeight: 'bold' }}
																	>
																		{s.routeText}
																	</Typography>
																	<Typography variant='body2' color='text.secondary'>
																		{s.timeText}
																	</Typography>
																</Box>
															))}
														</Box>
													) : (
														<Typography variant='body2' color='text.secondary'>
															—
														</Typography>
													)}
												</TableCell>
												<TableCell align='center'>{row.passengersCount || 0}</TableCell>
												<TableCell align='right'>
													{row.showLink && (
														<Button
															size='small'
															component='a'
															href={row.link}
															target='_blank'
															rel='noopener noreferrer'
															sx={{
																display: 'inline-flex',
																alignItems: 'center',
																gap: 0.5,
																textTransform: 'none',
																lineHeight: 1,
															}}
														>
															{UI_LABELS.PROFILE.open_link}
															<OpenInNewIcon fontSize='inherit' />
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</>
				)}
			</Paper>
		</Container>
	);
};

export default BookingsTab;

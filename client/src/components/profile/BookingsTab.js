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
	Link as MuiLink,
	Container,
	Chip,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { fetchUserBookings } from '../../redux/actions/booking';
import { UI_LABELS } from '../../constants/uiLabels';
import { ENUM_LABELS } from '../../constants/enumLabels';

const BookingsTab = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state) => state.auth.currentUser);
	const { bookings, isLoading } = useSelector((state) => state.bookings);

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
			};
		});
	}, [bookings]);

	if (isLoading) {
		return <Typography>{UI_LABELS.MESSAGES.loading}</Typography>;
	}

	return (
		<Container maxWidth='md' sx={{ mt: 7 }}>
			<Paper sx={{ p: 2, width: '100%' }}>
				<Typography variant='h4'>{UI_LABELS.PROFILE.bookings}</Typography>

				{bookings && bookings.length ? (
					<TableContainer>
						<Table size='medium'>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 'bold', width: { xs: '28%', sm: '22%', md: '20%' } }}>
										{UI_LABELS.PROFILE.booking_number}
									</TableCell>
									<TableCell sx={{ fontWeight: 'bold', width: { xs: '44%', sm: '56%', md: '60%' } }}>
										{UI_LABELS.PROFILE.route}
									</TableCell>
									<TableCell
										align='center'
										sx={{ fontWeight: 'bold', width: { xs: '12%', sm: '10%', md: '8%' } }}
									>
										{UI_LABELS.PROFILE.passengers}
									</TableCell>
									<TableCell />
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.id} hover>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
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
															<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
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
											<MuiLink
												href={row.link}
												target='_blank'
												underline='hover'
												sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
											>
												{UI_LABELS.PROFILE.open_link}
												<OpenInNewIcon fontSize='inherit' />
											</MuiLink>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				) : (
					<Typography sx={{ textAlign: 'center' }}>{UI_LABELS.PROFILE.no_bookings}</Typography>
				)}
			</Paper>
		</Container>
	);
};

export default BookingsTab;

import React, { useEffect } from 'react';
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
} from '@mui/material';

import { fetchUserBookings } from '../../redux/actions/booking';
import { UI_LABELS } from '../../constants/uiLabels';

const BookingsTab = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state) => state.auth.currentUser);
	const { bookings, isLoading } = useSelector((state) => state.bookings);

	useEffect(() => {
		if (currentUser?.id) {
			dispatch(fetchUserBookings(currentUser.id));
		}
	}, [dispatch, currentUser]);

	if (isLoading) {
		return <Typography>{UI_LABELS.MESSAGES.loading}</Typography>;
	}

	return bookings && bookings.length ? (
		<Box sx={{ maxWidth: 600, mx: 'auto' }}>
			<Typography variant='h6' sx={{ mb: 2 }}>
				{UI_LABELS.PROFILE.bookings}
			</Typography>
			<TableContainer component={Paper}>
				<Table size='small'>
					<TableHead sx={{ bgcolor: 'background.paper' }}>
						<TableRow>
							<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.booking_number}</TableCell>
							<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.status}</TableCell>
							<TableCell align='right' sx={{ fontWeight: 'bold' }}>
								{UI_LABELS.PROFILE.total_price}
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{bookings.map((b) => (
							<TableRow key={b.id}>
								<TableCell>{b.booking_number}</TableCell>
								<TableCell>{b.status}</TableCell>
								<TableCell align='right'>{b.total_price}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	) : (
		<Typography sx={{ textAlign: 'center' }}>{UI_LABELS.PROFILE.no_bookings}</Typography>
	);
};

export default BookingsTab;

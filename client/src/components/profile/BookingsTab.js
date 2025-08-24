import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';

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
		<TableContainer component={Paper}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>
							{UI_LABELS.PROFILE.booking_number}
						</TableCell>
						<TableCell>{UI_LABELS.PROFILE.status}</TableCell>
						<TableCell align='right'>
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
	) : (
		<Typography>{UI_LABELS.PROFILE.no_bookings}</Typography>
	);
};

export default BookingsTab;

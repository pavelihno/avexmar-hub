import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Container, TextField, Typography, Paper, Alert, Fade } from '@mui/material';

import Base from '../Base';
import { UI_LABELS } from '../../constants';
import { searchBooking } from '../../redux/actions/bookingSearch';

const BookingSearch = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { isLoading, errors } = useSelector((state) => state.bookingSearch);
	const [formData, setFormData] = useState({
		booking_number: '',
		first_name: '',
		last_name: '',
	});

	const onChange = (e) => {
		const { name, value } = e.target;
		const upperCaseFields = ['first_name', 'last_name'];
		const newValue = upperCaseFields.includes(name) ? value.toUpperCase() : value;
		setFormData({ ...formData, [name]: newValue });
	};

	const onSubmit = (e) => {
		e.preventDefault();
		const submissionData = {
			...formData,
			first_name: formData.first_name.toUpperCase(),
			last_name: formData.last_name.toUpperCase(),
		};
		dispatch(searchBooking(submissionData))
			.unwrap()
			.then((res) => {
				navigate(`/booking/${res.public_id}/completion?access_token=${res.access_token}`);
			})
			.catch(() => {});
	};

	return (
		<Base maxWidth='md'>
			<Container maxWidth='sm'>
				<Paper sx={{ p: { xs: 2, md: 4 }, mt: { xs: 2, md: 4 } }}>
					<Typography variant='h4' component='h4' align='center' gutterBottom>
						{UI_LABELS.BOOKING_SEARCH.title}
					</Typography>
					<Fade in={!!errors} timeout={300}>
						<div>
							{errors?.message && (
								<Alert severity='error' sx={{ mb: 2 }}>
									{errors.message}
								</Alert>
							)}
						</div>
					</Fade>
					<Box component='form' onSubmit={onSubmit}>
						<TextField
							fullWidth
							required
							label={UI_LABELS.BOOKING_SEARCH.booking_number}
							name='booking_number'
							margin='normal'
							value={formData.booking_number}
							onChange={onChange}
						/>
						<TextField
							fullWidth
							required
							label={UI_LABELS.BOOKING_SEARCH.last_name}
							name='last_name'
							margin='normal'
							value={formData.last_name}
							onChange={onChange}
						/>
						<TextField
							fullWidth
							required
							label={UI_LABELS.BOOKING_SEARCH.first_name}
							name='first_name'
							margin='normal'
							value={formData.first_name}
							onChange={onChange}
						/>
						<Button type='submit' variant='contained' fullWidth sx={{ mt: 2 }} disabled={isLoading}>
							{UI_LABELS.BOOKING_SEARCH.button}
						</Button>
					</Box>
				</Paper>
			</Container>
		</Base>
	);
};

export default BookingSearch;

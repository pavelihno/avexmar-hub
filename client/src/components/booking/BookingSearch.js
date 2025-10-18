import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Container, TextField, Typography, Paper, Alert, Fade, Stack, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';

import Base from '../Base';
import { UI_LABELS } from '../../constants';
import { searchBooking } from '../../redux/actions/bookingSearch';

const BookingSearch = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { isLoading, errors } = useSelector((state) => state.bookingSearch);
	const theme = useTheme();
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
			<Container maxWidth='sm' sx={{ py: { xs: 3, md: 6 } }}>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 3, md: 4 },
						borderRadius: 3,
						boxShadow: { xs: theme.shadows[2], md: theme.shadows[4] },
					}}
				>
					<Stack spacing={{ xs: 3, md: 4 }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								textAlign: 'center',
								gap: { xs: 1.5, md: 2 },
							}}
						>
							<Box
								sx={{
									width: 64,
									height: 64,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: alpha(theme.palette.primary.main, 0.12),
									color: theme.palette.primary.main,
								}}
							>
								<FlightTakeoffIcon fontSize='large' />
							</Box>
							<Typography variant='h4' component='h1'>
								{UI_LABELS.BOOKING_SEARCH.title}
							</Typography>
							<Typography variant='body1' color='text.secondary' sx={{ maxWidth: 360 }}>
								{UI_LABELS.BOOKING_SEARCH.subtitle}
							</Typography>
						</Box>

						<Fade in={!!errors} timeout={300}>
							<div>
								{errors?.message && (
									<Alert severity='error' sx={{ mb: 1 }}>
										{errors.message}
									</Alert>
								)}
							</div>
						</Fade>

						<Box component='form' onSubmit={onSubmit}>
							<Stack spacing={2}>
								<TextField
									fullWidth
									required
									label={UI_LABELS.BOOKING_SEARCH.booking_number}
									name='booking_number'
									value={formData.booking_number}
									onChange={onChange}
								/>
								<TextField
									fullWidth
									required
									label={UI_LABELS.BOOKING_SEARCH.last_name}
									name='last_name'
									value={formData.last_name}
									onChange={onChange}
								/>
								<TextField
									fullWidth
									required
									label={UI_LABELS.BOOKING_SEARCH.first_name}
									name='first_name'
									value={formData.first_name}
									onChange={onChange}
								/>
								<Button
									type='submit'
									variant='contained'
									fullWidth
									startIcon={<SearchIcon />}
									disabled={isLoading}
									sx={{
										mt: 1,
										py: 1.25,
										fontWeight: 600,
										borderRadius: 2,
										textTransform: 'none',
									}}
								>
									{UI_LABELS.BOOKING_SEARCH.button}
								</Button>
							</Stack>
						</Box>

						<Divider sx={{ borderStyle: 'dashed', borderColor: alpha(theme.palette.primary.main, 0.2) }} />

						<Box
							sx={{
								bgcolor: alpha(theme.palette.primary.main, 0.06),
								borderRadius: 2,
								p: { xs: 2, md: 2.5 },
							}}
						>
							<Stack direction='row' spacing={2} alignItems='flex-start'>
								<InfoOutlinedIcon sx={{ color: theme.palette.primary.main, mt: 0.25 }} />
								<Box>
									<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
										{UI_LABELS.BOOKING_SEARCH.hint_title}
									</Typography>
									<Typography variant='body2' color='text.secondary'>
										{UI_LABELS.BOOKING_SEARCH.hint_text}
									</Typography>
								</Box>
							</Stack>
						</Box>
					</Stack>
				</Paper>
			</Container>
		</Base>
	);
};

export default BookingSearch;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
	Box,
	Typography,
	Paper,
	TextField,
	Button,
	FormControl,
	FormControlLabel,
	Checkbox,
	FormHelperText,
} from '@mui/material';

import { UI_LABELS } from '../../constants/uiLabels';
import { FIELD_LABELS } from '../../constants/fieldLabels';
import { VALIDATION_MESSAGES } from '../../constants/validationMessages';
import { updateUser } from '../../redux/actions/user';
import { setCurrentUser } from '../../redux/reducers/auth';

const UserInfo = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state) => state.auth.currentUser);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		phoneNumber: '',
		consent: false,
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (currentUser) {
			setFormData((prev) => ({
				...prev,
				firstName: currentUser.first_name || '',
				lastName: currentUser.last_name || '',
				phoneNumber: currentUser.phone_number || '',
			}));
		}
	}, [currentUser]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const newErrors = {};
		if (!formData.lastName) newErrors.lastName = VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED;
		if (!formData.firstName) newErrors.firstName = VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED;
		if (!formData.phoneNumber) newErrors.phoneNumber = VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED;
		if (!formData.consent) newErrors.consent = VALIDATION_MESSAGES.BOOKING.consent.REQUIRED;
		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			return;
		}
		dispatch(
			updateUser({
				id: currentUser.id,
				first_name: formData.firstName,
				last_name: formData.lastName,
				phone_number: formData.phoneNumber,
				consent: formData.consent,
			})
		)
			.unwrap()
			.then((user) => {
				dispatch(setCurrentUser(user));
				setErrors({});
				setFormData((prev) => ({ ...prev, consent: false }));
			})
			.catch((res) => setErrors(res));
	};

	return (
		<Paper sx={{ p: 2, width: '100%', maxWidth: 400 }}>
			<Typography variant='h6' sx={{ mb: 2 }}>
				{UI_LABELS.PROFILE.user_info}
			</Typography>
			<Box component='form' onSubmit={handleSubmit}>
				<TextField
					margin='dense'
					fullWidth
					name='lastName'
					
					label={FIELD_LABELS.PASSENGER.last_name}
					value={formData.lastName}
					onChange={handleChange}
					error={!!errors.lastName}
					helperText={errors.lastName || ''}
				/>
				<TextField
					margin='dense'
					fullWidth
					name='firstName'
					label={FIELD_LABELS.PASSENGER.first_name}
					value={formData.firstName}
					onChange={handleChange}
					error={!!errors.firstName}
					helperText={errors.firstName || ''}
				/>
				<TextField
					margin='dense'
					fullWidth
					name='phoneNumber'
					label={FIELD_LABELS.BOOKING.phone_number}
					value={formData.phoneNumber}
					onChange={handleChange}
					error={!!errors.phoneNumber}
					helperText={errors.phoneNumber || ''}
				/>
				<FormControl required error={!!errors.consent} sx={{ mt: 2 }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={formData.consent}
								onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
							/>
						}
						label={
							<Typography variant='subtitle2' color='textSecondary'>
								{UI_LABELS.BOOKING.buyer_form.privacy_policy((text) => (
									<Link to='/privacy_policy' target='_blank'>
										{text}
									</Link>
								))}
							</Typography>
						}
					/>
					{errors.consent && <FormHelperText>{errors.consent}</FormHelperText>}
				</FormControl>
				<Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }}>
					{UI_LABELS.BUTTONS.save_changes}
				</Button>
			</Box>
		</Paper>
	);
};

export default UserInfo;

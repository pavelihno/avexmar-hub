import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { changePassword } from '../../redux/actions/user';
import { UI_LABELS } from '../../constants/uiLabels';

const PasswordTab = () => {
	const dispatch = useDispatch();
	const [passwordData, setPasswordData] = useState({
		newPassword: '',
		confirmPassword: '',
	});
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const handleChange = (e) => {
		setPasswordData({
			...passwordData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setErrors({
				confirmPassword: UI_LABELS.PROFILE.passwords_dont_match,
			});
			return;
		}
		dispatch(changePassword(passwordData.newPassword))
			.unwrap()
			.then(() => {
				setPasswordData({ newPassword: '', confirmPassword: '' });
				setErrors({});
				setSuccessMessage(UI_LABELS.PROFILE.password_changed);
			})
			.catch((res) => {
				setErrors(res);
			});
	};

		return (
				<Paper sx={{ p: 2, maxWidth: 400 }}>
						<Typography variant='h6' sx={{ mb: 2 }}>
								{UI_LABELS.PROFILE.change_password}
						</Typography>
						<Box component='form' onSubmit={handleSubmit}>
								{errors.message && (
										<Alert severity='error' sx={{ mb: 2 }}>
												{errors.message}
										</Alert>
								)}
								{successMessage && (
										<Alert severity='success' sx={{ mb: 2 }}>
												{successMessage}
										</Alert>
								)}
								<TextField
										margin='dense'
										required
										fullWidth
										name='newPassword'
										label={UI_LABELS.AUTH.new_password}
										type='password'
										id='newPassword'
										value={passwordData.newPassword}
										onChange={handleChange}
										error={!!errors.newPassword}
										helperText={errors.newPassword ? errors.newPassword : ''}
								/>
								<TextField
										margin='dense'
										required
										fullWidth
										name='confirmPassword'
										label={UI_LABELS.AUTH.confirm_password}
										type='password'
										id='confirmPassword'
										value={passwordData.confirmPassword}
										onChange={handleChange}
										error={!!errors.confirmPassword}
										helperText={
												errors.confirmPassword ? errors.confirmPassword : ''
										}
								/>
								<Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }}>
										{UI_LABELS.BUTTONS.save_changes}
								</Button>
						</Box>
				</Paper>
		);
};

export default PasswordTab;

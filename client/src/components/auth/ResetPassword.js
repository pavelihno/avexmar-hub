import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Paper, Alert, Fade, CircularProgress } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';

import { authIconContainer, authIcon } from '../../theme/styles';
import { resetPassword } from '../../redux/actions/auth';
import { UI_LABELS } from '../../constants/uiLabels';
import Base from '../Base';
import { useAuthModal } from '../../context/AuthModalContext';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const ResetPassword = ({ isModal = false, token: tokenProp = null }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { closeAuthModal } = useAuthModal();
	const token = tokenProp || searchParams.get('token') || '';

	const [formData, setFormData] = useState({
		password: '',
		confirm: '',
	});
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();

		if (formData.password !== formData.confirm) {
			setErrors({ confirm: UI_LABELS.PROFILE.passwords_dont_match });
			return;
		}

		setErrors({});
		dispatch(resetPassword({ token, password: formData.password }))
			.unwrap()
			.then(() => {
				setSuccessMessage(UI_LABELS.PROFILE.password_changed);
				setTimeout(() => navigate('/'), 1500);
			})
			.catch((res) => setErrors(res));
	};

	const content = (
		<Fade in={true} timeout={500}>
			<Paper
				sx={{
					p: { xs: 3, sm: 4 },
					position: 'relative',
					mx: 'auto',
					outline: 'none',
					width: '100%',
				}}
			>
				{isModal && (
					<IconButton
						aria-label='close'
						onClick={closeAuthModal}
						sx={{ position: 'absolute', right: { xs: 4, sm: 8 }, top: { xs: 4, sm: 8 } }}
					>
						<CloseIcon />
					</IconButton>
				)}
				<Typography variant='h4' component='h4' align='center' gutterBottom>
					{UI_LABELS.TITLES.forgot_password}
				</Typography>
				<Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
					<Box sx={authIconContainer}>
						<LockResetIcon sx={authIcon} />
					</Box>
				</Box>

				<Fade in={!!errors.message} timeout={300}>
					<div>
						{errors.message && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{errors.message}
							</Alert>
						)}
					</div>
				</Fade>

				<Fade in={!!successMessage} timeout={300}>
					<div>
						{successMessage && (
							<Alert severity='success' sx={{ mb: 2 }}>
								{successMessage}
							</Alert>
						)}
					</div>
				</Fade>

				{!successMessage ? (
					<Box component='form' onSubmit={onSubmit}>
						<TextField
							margin='dense'
							required
							fullWidth
							name='password'
							label={UI_LABELS.AUTH.new_password}
							type='password'
							id='password'
							autoFocus
							value={formData.password}
							onChange={onChange}
							error={!!errors.password}
							helperText={errors.password ? errors.password : ''}
						/>
						<TextField
							margin='dense'
							required
							fullWidth
							name='confirm'
							label={UI_LABELS.AUTH.confirm_password}
							type='password'
							id='confirm'
							value={formData.confirm}
							onChange={onChange}
							error={!!errors.confirm}
							helperText={errors.confirm ? errors.confirm : ''}
						/>
						<Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }}>
							{UI_LABELS.BUTTONS.send}
						</Button>
					</Box>
				) : (
					<Box
						sx={{
							minHeight: { xs: '10rem', sm: '12rem' },
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CircularProgress color='primary' size={40} />
					</Box>
				)}
			</Paper>
		</Fade>
	);

	return isModal ? (
		content
	) : (
		<Base
			sx={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				px: 2,
			}}
		>
			<Container maxWidth='sm' sx={{ mt: { xs: 2, sm: 3 } }}>
				{content}
			</Container>
		</Base>
	);
};

export default ResetPassword;

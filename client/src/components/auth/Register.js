import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Box,
	Button,
	Container,
	TextField,
	Typography,
	Paper,
	IconButton,
	Divider,
	Alert,
	Fade,
	CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { authIconContainer, authIcon, authLink } from '../../theme/styles';

import Base from '../Base';

import { register } from '../../redux/actions/auth';
import { useAuthModal } from '../../context/AuthModalContext';
import { FIELD_LABELS, UI_LABELS } from '../../constants';

const Register = ({ isModal = false }) => {
	const dispatch = useDispatch();
	const isLoading = useSelector((state) => state.auth.isLoading);
	const { closeAuthModal, openLoginModal } = useAuthModal();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		password2: '',
	});

	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const { email, password, password2 } = formData;

	const onChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: name === 'email' ? value.toLowerCase() : value,
		});
	};

	const onSubmit = async (e) => {
		e.preventDefault();

		if (password !== password2) {
			setErrors({ password2: UI_LABELS.PROFILE.passwords_dont_match });
			return;
		}

		setErrors({});
		dispatch(register(formData))
			.unwrap()
			.then(() => {
				setSuccessMessage(UI_LABELS.SUCCESS.register);
				if (isModal) {
					setTimeout(() => closeAuthModal(), 3000);
				}
			})
			.catch((res) => setErrors(res));
	};

	const handleLoginClick = (e) => {
		e.preventDefault();
		openLoginModal();
	};

	const content = (
		<Fade in={true} timeout={500}>
			<Paper
				sx={{
					p: { xs: 3, sm: 4 },
					position: 'relative',
					width: { xs: '100%', sm: 'auto' },
					maxWidth: { xs: '100%', sm: 300 },
					mx: 'auto',
					outline: 'none',
				}}
			>
				<IconButton aria-label='close' onClick={closeAuthModal} sx={{ position: 'absolute', right: 8, top: 8 }}>
					<CloseIcon />
				</IconButton>
				<Typography variant='h4' component='h4' align='center' gutterBottom>
					{UI_LABELS.TITLES.register}
				</Typography>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						my: 3,
					}}
				>
					<Box sx={authIconContainer}>
						<PersonAddIcon sx={authIcon} />
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
							id='email'
							label={FIELD_LABELS.USER.email}
							name='email'
							type='email'
							autoComplete='email'
							autoFocus
							value={email}
							onChange={onChange}
							error={!!errors.email}
							helperText={errors.email ? errors.email : ''}
							disabled={isLoading}
						/>
						<TextField
							margin='dense'
							required
							fullWidth
							name='password'
							label={FIELD_LABELS.USER.password}
							type='password'
							id='password'
							autoComplete='new-password'
							value={password}
							onChange={onChange}
							error={!!errors.password}
							helperText={errors.email ? errors.email : ''}
							disabled={isLoading}
						/>
						<TextField
							margin='dense'
							required
							fullWidth
							name='password2'
							label={UI_LABELS.AUTH.confirm_password}
							type='password'
							id='password2'
							autoComplete='new-password'
							value={password2}
							onChange={onChange}
							error={!!errors.password2}
							helperText={errors.email ? errors.email : ''}
							disabled={isLoading}
						/>
						<Divider sx={{ my: 1 }} />
						<Button type='submit' fullWidth variant='contained' disabled={isLoading}>
							{isLoading ? <CircularProgress size={24} color='inherit' /> : UI_LABELS.BUTTONS.register}
						</Button>
					</Box>
				) : (
					<Box
						sx={{
							height: '210px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CircularProgress color='primary' size={40} />
					</Box>
				)}

				{!successMessage && (
					<>
						<Divider sx={{ my: 2 }}>{UI_LABELS.AUTH.or}</Divider>

						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='body2'>
								{UI_LABELS.AUTH.have_account}{' '}
								<Box component='a' href='#' onClick={handleLoginClick} sx={authLink}>
									<Typography variant='subtitle2' component='span'>
										{UI_LABELS.BUTTONS.login}
									</Typography>
								</Box>
							</Typography>
						</Box>
					</>
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
			<Container maxWidth='sm'>{content}</Container>
		</Base>
	);
};

export default Register;

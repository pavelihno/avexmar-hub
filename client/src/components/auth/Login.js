import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

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
import PersonIcon from '@mui/icons-material/Person';

import { authIconContainer, authIcon, authLink } from '../../theme/styles';

import Base from '../Base';

import { login } from '../../redux/actions/auth';
import { useAuthModal } from '../../context/AuthModalContext';
import { FIELD_LABELS, UI_LABELS } from '../../constants';

const Login = ({ isModal = false }) => {
	const dispatch = useDispatch();
	const { closeAuthModal, openRegisterModal } = useAuthModal();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const { email, password } = formData;

	const onChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		setErrors({});
		dispatch(login(formData))
			.unwrap()
			.then(() => {
				setSuccessMessage(UI_LABELS.SUCCESS.login);
				if (isModal) {
					setTimeout(() => closeAuthModal(), 1500);
				}
			})
			.catch((res) => setErrors(res));
	};

	const handleRegisterClick = (e) => {
		e.preventDefault();
		openRegisterModal();
	};

	const content = (
		<Fade in={true} timeout={500}>
			<Paper
				sx={{
					p: 4,
					position: 'relative',
					maxWidth: '300px',
					mx: 'auto',
					outline: 'none',
				}}
			>
				<IconButton
					aria-label='close'
					onClick={closeAuthModal}
					sx={{ position: 'absolute', right: 8, top: 8 }}
				>
					<CloseIcon />
				</IconButton>
				<Typography
					variant='h4'
					component='h4'
					align='center'
					gutterBottom
				>
					{UI_LABELS.TITLES.login}
				</Typography>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						my: 3,
					}}
				>
                                        <Box sx={authIconContainer}>
                                                <PersonIcon sx={authIcon} />
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
							autoComplete='email'
							autoFocus
							value={email}
							onChange={onChange}
							error={!!errors.email}
							helperText={errors.email ? errors.email : ''}
						/>
						<TextField
							margin='dense'
							required
							fullWidth
							name='password'
							label={FIELD_LABELS.USER.password}
							type='password'
							id='password'
							autoComplete='current-password'
							value={password}
							onChange={onChange}
							error={!!errors.password}
							helperText={errors.password ? errors.password : ''}
						/>
						<Divider sx={{ my: 1 }} />
						<Button type='submit' fullWidth variant='contained'>
							{UI_LABELS.BUTTONS.login}
						</Button>
					</Box>
				) : (
					<Box
						sx={{
							height: '160px',
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
								{UI_LABELS.AUTH.no_account}{' '}
                                                                <Box
                                                                        component='a'
                                                                        href='#'
                                                                        onClick={handleRegisterClick}
                                                                        sx={authLink}
                                                                >
									<Typography
										variant='subtitle2'
										component='span'
									>
										{UI_LABELS.BUTTONS.register}
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
			}}
		>
			<Container maxWidth='sm'>{content}</Container>
		</Base>
	);
};

export default Login;

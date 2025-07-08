import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

import Base from '../Base';

import { login } from '../../redux/actions/auth';
import { selectIsAuth } from '../../redux/reducers/auth';
import { useAuthModal } from '../../context/AuthModalContext';

const Login = ({ isModal = false }) => {
	const dispatch = useDispatch();
	const isAuth = useSelector(selectIsAuth);
	const { closeAuthModal, openRegisterModal } = useAuthModal();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const [errors, setErrors] = useState({});

	const { email, password } = formData;

	useEffect(() => {
		if (isAuth && isModal) {
			closeAuthModal();
		}
	}, [isAuth, closeAuthModal, isModal]);

	const onChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		setErrors({});
		dispatch(login(formData))
			.unwrap()
			.then(() => {
				if (isModal) closeAuthModal();
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
					Вход
				</Typography>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						my: 3,
					}}
				>
					<Box
						sx={{
							bgcolor: '#f0f2ff',
							borderRadius: '50%',
							p: 2,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<PersonIcon sx={{ fontSize: 40, color: '#6c63ff' }} />
					</Box>
				</Box>

				{errors.message && (
					<Alert severity='error' sx={{ mb: 2 }}>
						{errors.message}
					</Alert>
				)}

				<Box component='form' onSubmit={onSubmit}>
					<TextField
						margin='normal'
						required
						fullWidth
						id='email'
						label='Электронная почта'
						name='email'
						autoComplete='email'
						autoFocus
						value={email}
						onChange={onChange}
						error={errors.email ? true : false}
						helperText={errors.email ? errors.email : ''}
					/>
					<TextField
						margin='normal'
						required
						fullWidth
						name='password'
						label='Пароль'
						type='password'
						id='password'
						autoComplete='current-password'
						value={password}
						onChange={onChange}
						error={errors.password ? true : false}
						helperText={errors.password ? errors.password : ''}
					/>
					<Divider sx={{ my: 1 }} />
					<Button type='submit' fullWidth variant='contained'>
						Войти
					</Button>
				</Box>

				<Divider sx={{ my: 2 }}>или</Divider>

				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='body2'>
						Нет аккаунта?{' '}
						<Box
							component='a'
							href='#'
							onClick={handleRegisterClick}
							sx={{
								color: '#6c63ff',
								textDecoration: 'none',
								cursor: 'pointer',
							}}
						>
							<Typography variant='subtitle2' component='span'>
								Зарегистрироваться
							</Typography>
						</Box>
					</Typography>
				</Box>
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

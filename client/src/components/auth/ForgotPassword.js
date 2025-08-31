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
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import { authIconContainer, authIcon, authLink } from '../../theme/styles';

import { forgotPassword } from '../../redux/actions/auth';
import { useAuthModal } from '../../context/AuthModalContext';
import { FIELD_LABELS, UI_LABELS } from '../../constants';
import Base from '../Base';

const ForgotPassword = ({ isModal = false }) => {
	const dispatch = useDispatch();
	const { closeAuthModal, openLoginModal } = useAuthModal();

	const [email, setEmail] = useState('');
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const onChange = (e) => setEmail(e.target.value);

	const onSubmit = async (e) => {
		e.preventDefault();
		setErrors({});
		dispatch(forgotPassword({ email }))
			.unwrap()
			.then(() => {
				setSuccessMessage(UI_LABELS.SUCCESS.password_reset);
				if (isModal) {
					setTimeout(() => closeAuthModal(), 1500);
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
					{UI_LABELS.TITLES.forgot_password}
				</Typography>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						my: 3,
					}}
				>
					<Box sx={authIconContainer}>
						<MailOutlineIcon sx={authIcon} />
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
						<Divider sx={{ my: 1 }} />
						<Button type='submit' fullWidth variant='contained'>
							{UI_LABELS.BUTTONS.send}
						</Button>
					</Box>
				) : (
					<Box
						sx={{
							height: '120px',
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

export default ForgotPassword;

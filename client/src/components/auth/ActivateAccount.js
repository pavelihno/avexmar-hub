import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Fade, Paper, Typography, IconButton, Container } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { activateAccount } from '../../redux/actions/auth';
import { useAuthModal } from '../../context/AuthModalContext';
import { UI_LABELS } from '../../constants';
import Base from '../Base';

const ActivateAccount = ({ isModal = false, token: tokenProp = null }) => {
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const { openLoginModal } = useAuthModal();

	const token = tokenProp || searchParams.get('token') || '';

	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (!token) return;
		dispatch(activateAccount({ token }))
			.unwrap()
			.then(() => {
				setMessage(UI_LABELS.SUCCESS.account_activated);
			})
			.catch((res) => setError(res.message));
	}, [dispatch, token, openLoginModal]);

	const handleClose = () => {
		openLoginModal('/');
	};

	const content = (
		<Fade in={true} timeout={500}>
			<Paper
				sx={{
					p: { xs: 3, sm: 4 },
					position: 'relative',
					mx: 'auto',
					textAlign: 'center',
					outline: 'none',
					width: '100%',
				}}
			>
				{isModal && (
					<IconButton
						aria-label='close'
						onClick={handleClose}
						sx={{ position: 'absolute', right: { xs: 4, sm: 8 }, top: { xs: 4, sm: 8 } }}
					>
						<CloseIcon />
					</IconButton>
				)}
				<Typography variant='h4' component='h4' align='center' gutterBottom>
					{UI_LABELS.TITLES.activate_account}
				</Typography>
				<Fade in={!!error} timeout={300}>
					<div>
						{error && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
					</div>
				</Fade>
				<Fade in={!!message} timeout={300}>
					<div>
						{message && (
							<Alert severity='success' sx={{ mb: 2 }}>
								{message}
							</Alert>
						)}
					</div>
				</Fade>
				{!message && !error && (
					<Box
						sx={{
							minHeight: { xs: '6rem', sm: '8rem' },
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CircularProgress color='primary' size={40} />
					</Box>
				)}
				{message && (
					<Button variant='contained' onClick={() => openLoginModal('/')} sx={{ mt: 2 }}>
						{UI_LABELS.BUTTONS.login}
					</Button>
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
			<Container maxWidth='xs' sx={{ mt: { xs: 2, sm: 3 } }}>
				{content}
			</Container>
		</Base>
	);
};

export default ActivateAccount;

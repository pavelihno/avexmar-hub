import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Fade, Paper, Typography } from '@mui/material';

import { activateAccount } from '../../redux/actions/auth';
import { useAuthModal } from '../../context/AuthModalContext';
import { UI_LABELS } from '../../constants';

const ActivateAccount = () => {
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const { openLoginModal } = useAuthModal();

	const token = searchParams.get('token') || '';

	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		dispatch(activateAccount({ token }))
			.unwrap()
			.then(() => {
				setMessage(UI_LABELS.SUCCESS.account_activated);
				setTimeout(() => openLoginModal(), 1500);
			})
			.catch((res) => setError(res.message));
	}, [dispatch, token, openLoginModal]);

	return (
		<Fade in={true} timeout={500}>
			<Paper
				sx={{
					p: 4,
					maxWidth: '300px',
					mx: 'auto',
					textAlign: 'center',
				}}
			>
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
					<Box sx={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<CircularProgress color='primary' size={40} />
					</Box>
				)}
				{message && (
					<Button variant='contained' onClick={openLoginModal} sx={{ mt: 2 }}>
						{UI_LABELS.BUTTONS.login}
					</Button>
				)}
			</Paper>
		</Fade>
	);
};

export default ActivateAccount;

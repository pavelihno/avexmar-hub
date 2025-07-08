import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';

import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';

import { changePassword } from '../../redux/actions/user';
import { useProfileModal } from '../../context/ProfileModalContext';

const ProfileModal = () => {
	const { profileModalOpen, closeProfileModal } = useProfileModal();
	const dispatch = useDispatch();

	const [passwordData, setPasswordData] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordError, setPasswordError] = useState('');

	const handlePasswordChange = (e) => {
		setPasswordData({
			...passwordData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmitPasswordChange = (e) => {
		e.preventDefault();

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setPasswordError('Пароли не совпадают');
			return;
		}

		dispatch(changePassword(passwordData.newPassword))
			.unwrap()
			.then(() => {
				setPasswordData({
					oldPassword: '',
					newPassword: '',
					confirmPassword: '',
				});
				setPasswordError('');
				closeProfileModal();
			})
			.catch((error) => {
				setPasswordError(error.message || 'Ошибка при смене пароля');
			});
	};

	return (
		<Modal
			open={profileModalOpen}
			onClose={closeProfileModal}
			aria-labelledby='profile-modal-title'
            closeAfterTransition
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				p: 2,
			}}
		>
			<Fade in={profileModalOpen}>
				<Paper
					sx={{
						p: 4,
						position: 'relative',
						maxWidth: '400px',
						mx: 'auto',
						outline: 'none',
					}}
				>
					<IconButton
						aria-label='close'
						onClick={closeProfileModal}
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
						Настройки профиля
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
							<LockIcon sx={{ fontSize: 40, color: '#6c63ff' }} />
						</Box>
					</Box>

					<Typography variant='body1' align='center' sx={{ mb: 3 }}>
						Скоро здесь будет личный кабинет
					</Typography>

					<Divider sx={{ my: 2 }}>Сменить пароль</Divider>

					{passwordError && (
						<Alert severity='error' sx={{ mb: 2 }}>
							{passwordError}
						</Alert>
					)}

					<Box component='form' onSubmit={handleSubmitPasswordChange}>
						<TextField
							margin='normal'
							required
							fullWidth
							name='oldPassword'
							label='Текущий пароль'
							type='password'
							id='oldPassword'
							value={passwordData.oldPassword}
							onChange={handlePasswordChange}
						/>
						<TextField
							margin='normal'
							required
							fullWidth
							name='newPassword'
							label='Новый пароль'
							type='password'
							id='newPassword'
							value={passwordData.newPassword}
							onChange={handlePasswordChange}
						/>
						<TextField
							margin='normal'
							required
							fullWidth
							name='confirmPassword'
							label='Подтвердите новый пароль'
							type='password'
							id='confirmPassword'
							value={passwordData.confirmPassword}
							onChange={handlePasswordChange}
						/>

						<Divider sx={{ my: 2 }} />

						<Button type='submit' fullWidth variant='contained'>
							Сохранить изменения
						</Button>
					</Box>
				</Paper>
			</Fade>
		</Modal>
	);
};

export default ProfileModal;

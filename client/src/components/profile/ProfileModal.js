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
import ConstructionIcon from '@mui/icons-material/Construction';

import { authIconContainer, authIcon } from '../../theme/styles';

import { changePassword } from '../../redux/actions/user';
import { useProfileModal } from '../../context/ProfileModalContext';
import { UI_LABELS } from '../../constants/uiLabels';

const ProfileModal = () => {
	const { profileModalOpen, closeProfileModal } = useProfileModal();
	const dispatch = useDispatch();

	const [passwordData, setPasswordData] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');

	const handlePasswordChange = (e) => {
		setPasswordData({
			...passwordData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmitPasswordChange = (e) => {
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
				setPasswordData({
					oldPassword: '',
					newPassword: '',
					confirmPassword: '',
				});
				setErrors({});
				setSuccessMessage(UI_LABELS.PROFILE.password_changed);
			})
			.catch((res) => {
				setErrors(res);
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
						maxWidth: '375px',
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
						{UI_LABELS.PROFILE.settings}
					</Typography>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							my: 3,
						}}
					>
                                                <Box sx={authIconContainer}>
                                                        <LockIcon sx={authIcon} />
                                                </Box>
					</Box>

					<Alert
						severity='warning'
						icon={<ConstructionIcon />}
						sx={{
							mb: 3,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{UI_LABELS.PROFILE.maintenance}
					</Alert>

					<Divider sx={{ my: 2 }}>{UI_LABELS.PROFILE.change_password}</Divider>

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

					<Box component='form' onSubmit={handleSubmitPasswordChange}>
						<TextField
							margin='dense'
							required
							fullWidth
							name='oldPassword'
							label={UI_LABELS.AUTH.old_password}
							type='password'
							id='oldPassword'
							value={passwordData.oldPassword}
							onChange={handlePasswordChange}
							error={!!errors.oldPassword}
							helperText={
								errors.oldPassword ? errors.oldPassword : ''
							}
						/>
						<TextField
							margin='dense'
							required
							fullWidth
							name='newPassword'
							label={UI_LABELS.AUTH.new_password}
							type='password'
							id='newPassword'
							value={passwordData.newPassword}
							onChange={handlePasswordChange}
							error={!!errors.newPassword}
							helperText={
								errors.newPassword ? errors.newPassword : ''
							}
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
							onChange={handlePasswordChange}
							error={!!errors.confirmPassword}
							helperText={
								errors.confirmPassword
									? errors.confirmPassword
									: ''
							}
						/>

						<Divider sx={{ my: 2 }} />

						<Button type='submit' fullWidth variant='contained'>
							{UI_LABELS.BUTTONS.save_changes}
						</Button>
					</Box>
				</Paper>
			</Fade>
		</Modal>
	);
};

export default ProfileModal;

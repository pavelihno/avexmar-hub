import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';

import { useAuthModal } from '../context/AuthModalContext';
import { useProfileModal } from '../context/ProfileModalContext';
import { selectIsAuth, selectIsAdmin } from '../redux/reducers/auth';
import { logout } from '../redux/actions/auth';

const Header = () => {
	const dispatch = useDispatch();

	const { openLoginModal, openRegisterModal } = useAuthModal();
	const { openProfileModal } = useProfileModal();

	const isAuth = useSelector(selectIsAuth);
	const isAdmin = useSelector(selectIsAdmin);
	const currentUser = useSelector((state) => state.auth.currentUser);

	// Profile menu state
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);

	const handleProfileClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleOpenProfileModal = () => {
		openProfileModal();
		handleMenuClose();
	};

	const handleLogout = () => {
		handleMenuClose();
		dispatch(logout());
	};

	return (
		<Box
			component='header'
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				py: 2,
				borderBottom: '1px solid #E0E0E0',
				mb: 3,
			}}
		>
			<Box
				component={Link}
				to='/'
				sx={{
					display: 'flex',
					alignItems: 'center',
					textDecoration: 'none',
					color: 'inherit',
				}}
			>
				<Box
					component='img'
					src='/images/logo/logo32.png'
					alt='Avexmar logo'
					sx={{ width: 32, height: 32, mr: 1 }}
				/>
				<Typography variant='h4' component='span'>
					АВЕКСМАР
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				{isAdmin && (
					<Button
						component={Link}
						to='/admin'
						color='inherit'
						startIcon={
							<AdminPanelSettingsIcon
								sx={{ width: 32, height: 32 }}
							/>
						}
						sx={{ textTransform: 'none' }}
					>
						Панель администратора
					</Button>
				)}

				{isAuth ? (
					<>
						<Button
							color='inherit'
							onClick={handleProfileClick}
							startIcon={
								<Avatar sx={{ width: 32, height: 32 }} />
							}
							sx={{ textTransform: 'none' }}
						>
							{currentUser?.name || 'Профиль'}
						</Button>

						<Menu
							anchorEl={anchorEl}
							open={open}
							onClose={handleMenuClose}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'right',
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
						>
							<MenuItem onClick={handleOpenProfileModal}>
								<SettingsIcon fontSize='small' sx={{ mr: 1 }} />
								Настройки
							</MenuItem>
							<MenuItem onClick={handleLogout}>
								<LoginIcon fontSize='small' sx={{ mr: 1, color: 'red' }} />
								Выйти
							</MenuItem>
						</Menu>
					</>
				) : (
					<>
						<Button
							color='inherit'
							onClick={openLoginModal}
							startIcon={<LoginIcon />}
							sx={{ textTransform: 'none' }}
						>
							Войти
						</Button>
						<Button
							color='inherit'
							onClick={openRegisterModal}
							startIcon={<PersonAddIcon />}
							sx={{ textTransform: 'none' }}
						>
							Зарегистрироваться
						</Button>
					</>
				)}
			</Box>
		</Box>
	);
};

export default Header;

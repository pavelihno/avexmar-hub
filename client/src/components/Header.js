import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuthModal } from '../context/AuthModalContext';
import { selectIsAuth, selectIsAdmin } from '../redux/reducers/auth';
import { logout } from '../redux/actions/auth';
import { UI_LABELS } from '../constants';
import UserAvatar, { getUserDisplayName } from './shared/UserAvatar';

const Header = () => {
	const companyName = UI_LABELS.ABOUT.company_name;

	const dispatch = useDispatch();

	const { openLoginModal, openRegisterModal } = useAuthModal();
	const navigate = useNavigate();

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const isAuth = useSelector(selectIsAuth);
	const isAdmin = useSelector(selectIsAdmin);
	const currentUser = useSelector((state) => state.auth.currentUser);

	const [drawerOpen, setDrawerOpen] = useState(false);

	const handleGoToProfile = () => {
		navigate('/profile');
		setDrawerOpen(false);
	};

	const handleLogout = () => {
		dispatch(logout());
		setDrawerOpen(false);
	};

	const toggleDrawer = (openState) => () => {
		setDrawerOpen(openState);
	};

	const userLabel = useMemo(() => getUserDisplayName(currentUser, UI_LABELS.PROFILE.profile), [currentUser]);

	return (
		<AppBar
			component='header'
			position='static'
			color='transparent'
			elevation={0}
			sx={{ borderBottom: 1, borderColor: 'divider' }}
		>
			<Toolbar
				sx={{
					justifyContent: 'space-between',
					alignItems: 'center',
					py: { xs: 1, md: 1.5 },
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
						transition: 'transform 0.2s ease',
						cursor: 'pointer',
						'&:hover': {
							transform: 'scale(1.02)',
						},
					}}
				>
					<Box
						component='img'
						src='/images/logo/icon-512.png'
						alt='Avexmar logo'
						sx={{ width: 50, height: 50, mr: 1.5 }}
					/>
					<Typography variant='h4' component='span'>
						{companyName.toUpperCase()}
					</Typography>
				</Box>{' '}
				{isMobile ? (
					<>
						<IconButton edge='end' color='inherit' onClick={toggleDrawer(true)}>
							<MenuIcon />
						</IconButton>
						<Drawer anchor='right' open={drawerOpen} onClose={toggleDrawer(false)}>
							<Box
								sx={{
									width: 250,
									mt: 2,
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									gap: 4,
								}}
							>
								{isAuth ? (
									<Button
										color='inherit'
										onClick={handleGoToProfile}
										startIcon={
											<UserAvatar
												user={currentUser}
												size={32}
												fallback={UI_LABELS.PROFILE.profile[0]}
											/>
										}
										sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
									>
										{userLabel}
									</Button>
								) : (
									<>
										<Button
											color='inherit'
											onClick={openLoginModal}
											startIcon={<LoginIcon />}
											sx={{ textTransform: 'none' }}
										>
											{UI_LABELS.BUTTONS.login}
										</Button>
										<Button
											color='inherit'
											onClick={openRegisterModal}
											startIcon={<PersonAddIcon />}
											sx={{ textTransform: 'none' }}
										>
											{UI_LABELS.BUTTONS.register}
										</Button>
									</>
								)}

								<Button
									component={Link}
									to='/search/booking'
									color='inherit'
									startIcon={<SearchIcon sx={{ width: 32, height: 32 }} />}
									sx={{ textTransform: 'none' }}
								>
									{UI_LABELS.BOOKING_SEARCH.link}
								</Button>

								{isAdmin && (
									<Button
										component={Link}
										to='/admin'
										color='inherit'
										startIcon={<AdminPanelSettingsIcon sx={{ width: 32, height: 32 }} />}
										sx={{ textTransform: 'none' }}
									>
										{UI_LABELS.ADMIN.panel}
									</Button>
								)}

								{isAuth && (
									<Button
										color='inherit'
										onClick={handleLogout}
										startIcon={<LogoutIcon sx={{ color: 'red' }} />}
										sx={{ textTransform: 'none' }}
									>
										{UI_LABELS.BUTTONS.exit}
									</Button>
								)}
							</Box>
						</Drawer>
					</>
				) : (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<Button
							component={Link}
							to='/search/booking'
							color='inherit'
							startIcon={<SearchIcon sx={{ width: 32, height: 32 }} />}
							sx={{ textTransform: 'none' }}
						>
							{UI_LABELS.BOOKING_SEARCH.link}
						</Button>
						{isAdmin && (
							<Button
								component={Link}
								to='/admin'
								color='inherit'
								startIcon={<AdminPanelSettingsIcon sx={{ width: 32, height: 32 }} />}
								sx={{ textTransform: 'none' }}
							>
								{UI_LABELS.ADMIN.panel}
							</Button>
						)}
						{isAuth ? (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Button
									component={Link}
									to='/profile'
									color='inherit'
									startIcon={
										<UserAvatar
											user={currentUser}
											size={32}
											fallback={UI_LABELS.PROFILE.profile[0]}
										/>
									}
									sx={{ textTransform: 'none' }}
								>
									{userLabel}
								</Button>
								<Button
									color='inherit'
									onClick={handleLogout}
									startIcon={<LogoutIcon sx={{ color: 'red' }} />}
									sx={{ textTransform: 'none' }}
								>
									{UI_LABELS.BUTTONS.exit}
								</Button>
							</Box>
						) : (
							<>
								<Button
									color='inherit'
									onClick={openLoginModal}
									startIcon={<LoginIcon />}
									sx={{ textTransform: 'none' }}
								>
									{UI_LABELS.BUTTONS.login}
								</Button>
								<Button
									color='inherit'
									onClick={openRegisterModal}
									startIcon={<PersonAddIcon />}
									sx={{ textTransform: 'none' }}
								>
									{UI_LABELS.BUTTONS.register}
								</Button>
							</>
						)}
					</Box>
				)}
			</Toolbar>
		</AppBar>
	);
};

export default Header;

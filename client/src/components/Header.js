import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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

import { useAuthModal } from '../context/AuthModalContext';
import { selectIsAuth, selectIsAdmin } from '../redux/reducers/auth';
import { logout } from '../redux/actions/auth';
import { UI_LABELS } from '../constants';

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

	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const handleProfileClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleGoToProfile = () => {
		navigate('/profile');
		handleMenuClose();
		setDrawerOpen(false);
	};

	const handleLogout = () => {
		handleMenuClose();
		dispatch(logout());
		setDrawerOpen(false);
	};

	const toggleDrawer = (openState) => () => {
		setDrawerOpen(openState);
	};

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
					}}
				>
					<Box
						component='img'
						src='/images/logo/logo32.png'
						alt='Avexmar logo'
						sx={{ width: 32, height: 32, mr: 1 }}
					/>
					<Typography variant='h4' component='span'>
						{companyName.toUpperCase()}
					</Typography>
				</Box>

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
										startIcon={<Avatar sx={{ width: 32, height: 32 }} />}
										sx={{ textTransform: 'none' }}
									>
										{UI_LABELS.PROFILE.profile}
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
										startIcon={<LoginIcon sx={{ color: 'red' }} />}
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
							<Button
								color='inherit'
								onClick={handleProfileClick}
								startIcon={<Avatar sx={{ width: 32, height: 32 }} />}
								sx={{ textTransform: 'none' }}
							>
								{UI_LABELS.PROFILE.profile}
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
					</Box>
				)}

				{isAuth && !isMobile && (
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
						<MenuItem onClick={handleGoToProfile} sx={{ py: 1.5 }}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Avatar sx={{ width: 32, height: 32, mr: 1 }} />
								<Box>
									<Typography variant='subtitle2'>{UI_LABELS.PROFILE.to_profile}</Typography>
									{currentUser?.email && (
										<Typography variant='caption' color='text.secondary'>
											{currentUser.email}
										</Typography>
									)}
								</Box>
							</Box>
						</MenuItem>
						<MenuItem onClick={handleLogout}>
							<LoginIcon fontSize='small' sx={{ mr: 1, color: 'red' }} />
							{UI_LABELS.BUTTONS.exit}
						</MenuItem>
					</Menu>
				)}
			</Toolbar>
		</AppBar>
	);
};

export default Header;

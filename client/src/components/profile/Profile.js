import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { Box, Tabs, Tab, Paper, Typography, Grid, Stack } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FlightIcon from '@mui/icons-material/Flight';
import GroupIcon from '@mui/icons-material/Group';

import Base from '../Base';
import { UI_LABELS } from '../../constants/uiLabels';
import UserInfo from './UserInfo';
import BookingsTab from './BookingsTab';
import PassengersTab from './PassengersTab';
import PasswordTab from './PasswordTab';
import UserAvatar, { getUserDisplayName } from '../shared/UserAvatar';

const Profile = () => {
	const [tab, setTab] = useState(0);
	const currentUser = useSelector((state) => state.auth.currentUser);

	const email = currentUser?.email || currentUser?.email_address || '';
	const displayName = getUserDisplayName(currentUser, UI_LABELS.PROFILE.profile);
	const fallbackInitial = UI_LABELS.PROFILE.profile[0];

	const tabConfig = [
		{ label: UI_LABELS.PROFILE.user_info, icon: <PersonIcon />, value: 0 },
		{ label: UI_LABELS.PROFILE.bookings, icon: <FlightIcon />, value: 1 },
		{ label: UI_LABELS.PROFILE.passengers, icon: <GroupIcon />, value: 2 },
	];

	const handleChange = (_e, newValue) => setTab(newValue);

	return (
		<Base maxWidth='lg'>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					px: { xs: 1, md: 0 },
				}}
			>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 2.5, md: 4 },
						width: '100%',
						borderRadius: 4,
					}}
				>
					<Stack spacing={{ xs: 1, md: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={{ xs: 2, sm: 3 }}
							alignItems='center'
							textAlign={{ xs: 'center', sm: 'left' }}
						>
							<UserAvatar
								user={currentUser}
								size={72}
								fallback={fallbackInitial}
								sx={{ width: { xs: 64, md: 72 }, height: { xs: 64, md: 72 }, fontSize: 24 }}
							/>
							<Box sx={{ width: '100%' }}>
								<Typography variant='h3'>{displayName}</Typography>
								{email && (
									<Typography variant='body1' color='text.secondary'>
										{email}
									</Typography>
								)}
							</Box>
						</Stack>

						<Box sx={{ width: '100%' }}>
							<Tabs
								value={tab}
								onChange={handleChange}
								variant='scrollable'
								scrollButtons='auto'
								allowScrollButtonsMobile
								indicatorColor='primary'
								textColor='primary'
								aria-label='profile tabs'
								sx={{
									width: '100%',
									maxWidth: '100%',
									overflow: 'visible',
									'& .MuiTabs-flexContainer': {
										justifyContent: { xs: 'flex-start', md: 'center' },
										gap: { xs: 0.75, md: 1 },
									},
									'& .MuiTabs-scroller': {
										overflowX: 'auto !important',
										scrollbarWidth: 'none',
										WebkitOverflowScrolling: 'touch',
										pb: 0.5,
									},
									'& .MuiTabs-scroller::-webkit-scrollbar': {
										display: 'none',
									},
									'& .MuiTab-root': {
										minWidth: 'auto',
										textTransform: 'none',
									},
								}}
							>
								{tabConfig.map((tabItem) => (
									<Tab
										key={tabItem.value}
										value={tabItem.value}
										icon={tabItem.icon}
										iconPosition='start'
										label={tabItem.label}
										disableRipple
									/>
								))}
							</Tabs>
						</Box>

						<Grid container spacing={{ xs: 2, md: 4 }} justifyContent='center'>
							{tab === 0 && (
								<>
									<Grid item xs={12} md={6}>
										<UserInfo />
									</Grid>
									<Grid item xs={12} md={4}>
										<PasswordTab />
									</Grid>
								</>
							)}

							{tab === 1 && <BookingsTab />}
							{tab === 2 && <PassengersTab />}
						</Grid>
					</Stack>
				</Paper>
			</Box>
		</Base>
	);
};

export default Profile;

import React, { useState } from 'react';

import { Container, Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FlightIcon from '@mui/icons-material/Flight';
import GroupIcon from '@mui/icons-material/Group';

import Base from '../Base';
import { UI_LABELS } from '../../constants/uiLabels';
import UserInfo from './UserInfo';
import BookingsTab from './BookingsTab';
import PassengersTab from './PassengersTab';
import PasswordTab from './PasswordTab';

const Profile = () => {
	const [tab, setTab] = useState(0);

	const handleChange = (_e, newValue) => {
		setTab(newValue);
	};

	return (
		<Base maxWidth='lg'>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					p: 4,
				}}
			>
				<Paper elevation={0} sx={{ p: 3, width: '100%' }}>
					<Typography variant='h3' sx={{ mb: 2 }}>
						{UI_LABELS.PROFILE.profile}
					</Typography>
					<Tabs
						value={tab}
						onChange={handleChange}
						centered
						indicatorColor='primary'
						textColor='primary'
						sx={{ mb: 3 }}
					>
						<Tab icon={<PersonIcon />} label={UI_LABELS.PROFILE.user_info} />
						<Tab icon={<FlightIcon />} label={UI_LABELS.PROFILE.bookings} />
						<Tab icon={<GroupIcon />} label={UI_LABELS.PROFILE.passengers} />
					</Tabs>
					{tab === 0 && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: { xs: 'column', md: 'row' },
								alignItems: 'center',
								justifyContent: 'space-between',
								px: 10,
							}}
						>
							<UserInfo />
							<PasswordTab />
						</Box>
					)}
					{tab === 1 && <BookingsTab />}
					{tab === 2 && <PassengersTab />}
				</Paper>
			</Box>
		</Base>
	);
};

export default Profile;

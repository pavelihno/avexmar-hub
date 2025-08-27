import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import FlightIcon from '@mui/icons-material/Flight';
import GroupIcon from '@mui/icons-material/Group';
import Stack from '@mui/material/Stack';

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
		<Base maxWidth="lg">
			<Box
				sx={{
					minHeight: '80vh',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					p: 4,
				}}
			>
				<Paper elevation={0} sx={{ p: 3, width: '100%', maxWidth: 600 }}>
					<Typography variant="h5" sx={{ mb: 2 }}>
						{UI_LABELS.PROFILE.settings}
					</Typography>
					<Tabs
						value={tab}
						onChange={handleChange}
						centered
						indicatorColor="primary"
						textColor="primary"
						sx={{ mb: 3 }}
					>
						<Tab icon={<PersonIcon />} label={UI_LABELS.PROFILE.user_info} />
						<Tab icon={<FlightIcon />} label={UI_LABELS.PROFILE.bookings} />
						<Tab icon={<GroupIcon />} label={UI_LABELS.PROFILE.passengers} />
					</Tabs>
					{tab === 0 && (
						<Stack spacing={3} alignItems="center">
							<UserInfo />
							<PasswordTab />
						</Stack>
					)}
					{tab === 1 && <BookingsTab />}
					{tab === 2 && <PassengersTab />}
				</Paper>
			</Box>
		</Base>
	);
};

export default Profile;

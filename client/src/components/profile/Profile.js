import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

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
		<Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
			<Paper elevation={3} sx={{ p: 3 }}>
				<Typography variant='h5' sx={{ mb: 2 }}>
					{UI_LABELS.PROFILE.settings}
				</Typography>
<Tabs value={tab} onChange={handleChange} sx={{ mb: 3 }}>
<Tab label={UI_LABELS.PROFILE.user_info} />
<Tab label={UI_LABELS.PROFILE.bookings} />
<Tab label={UI_LABELS.PROFILE.passengers} />
<Tab label={UI_LABELS.PROFILE.change_password} />
</Tabs>
{tab === 0 && <UserInfo />}
{tab === 1 && <BookingsTab />}
{tab === 2 && <PassengersTab />}
{tab === 3 && <PasswordTab />}
			</Paper>
		</Box>
	);
};

export default Profile;

import React, { useState } from 'react';

import { Container, Box, Tabs, Tab, Paper, Typography, Grid } from '@mui/material';
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

					<Grid container spacing={4} justifyContent='center' sx={{ mt: 1, mx: 'auto' }}>
						{tab === 0 && (
							<>
								<Grid item xs={10} md={6}>
									<UserInfo />
								</Grid>
								<Grid item xs={10} md={4}>
									<PasswordTab />
								</Grid>
							</>
						)}

						{tab === 1 && <BookingsTab />}
						{tab === 2 && <PassengersTab />}
					</Grid>
				</Paper>
			</Box>
		</Base>
	);
};

export default Profile;

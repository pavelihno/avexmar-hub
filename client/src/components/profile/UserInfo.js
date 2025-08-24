import React from 'react';
import { useSelector } from 'react-redux';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { UI_LABELS } from '../../constants/uiLabels';

const UserInfo = () => {
	const currentUser = useSelector((state) => state.auth.currentUser);

	return (
		<Box>
			<Typography variant='h6' gutterBottom>
				{UI_LABELS.PROFILE.user_info}
			</Typography>
			<Typography>{`${UI_LABELS.PROFILE.email}: ${currentUser?.email}`}</Typography>
			<Typography>{`${UI_LABELS.PROFILE.role}: ${currentUser?.role}`}</Typography>
		</Box>
	);
};

export default UserInfo;

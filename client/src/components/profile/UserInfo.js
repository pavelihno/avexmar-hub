import React from 'react';
import { useSelector } from 'react-redux';

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import { UI_LABELS } from '../../constants/uiLabels';

const UserInfo = () => {
	const currentUser = useSelector((state) => state.auth.currentUser);

	return (
	        <Paper sx={{ p: 2 }}>
	                <Typography variant='h6' gutterBottom>
	                        {UI_LABELS.PROFILE.user_info}
	                </Typography>
	                <Stack spacing={1}>
	                        <Typography>{`${currentUser?.last_name || ''} ${currentUser?.first_name || ''}`}</Typography>
	                        <Typography>{`${UI_LABELS.PROFILE.email}: ${currentUser?.email}`}</Typography>
	                </Stack>
	        </Paper>
	);
};

export default UserInfo;

import React, { useMemo } from 'react';
import Avatar from '@mui/material/Avatar';
import { alpha, useTheme } from '@mui/material/styles';

const DEFAULT_FALLBACK = '?';

export const getUserDisplayName = (user, fallback = '') => {
	if (!user) return fallback;
	const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
	if (name) return name;
	return user.email || user.email_address || fallback;
};

export const getUserInitials = (user, fallback = DEFAULT_FALLBACK) => {
	if (!user) return fallback;

	const parts = [user.first_name, user.last_name]
		.filter(Boolean)
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length) {
		return parts
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	}

	const email = user.email || user.email_address;
	if (email?.length) return email[0].toUpperCase();

	return fallback;
};

const UserAvatar = ({ user, size = 40, fallback = DEFAULT_FALLBACK, sx, ...rest }) => {
	const theme = useTheme();
	// const initials = useMemo(() => getUserInitials(user, fallback), [user, fallback]);

	return (
		<Avatar
			sx={{
				width: size,
				height: size,
				fontWeight: 600,
				bgcolor: alpha(theme.palette.primary.main, 0.2),
				color: theme.palette.primary.main,
				...sx,
			}}
			{...rest}
		>
			{/* {initials} */}
		</Avatar>
	);
};

export default UserAvatar;

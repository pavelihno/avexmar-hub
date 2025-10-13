import React, { useMemo } from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';

import { PASSWORD_STRENGTH } from '../../constants';
import { evaluatePasswordStrength } from '../utils';

const STRENGTH_COLORS = ['error.main', 'error.main', 'warning.main', 'success.main', 'success.dark'];

const resolveThemeColor = (theme, colorKey) => {
	if (!colorKey) return theme.palette.primary.main;
	const [group, shade] = colorKey.split('.');
	const paletteGroup = theme.palette[group];
	if (!paletteGroup) return theme.palette.primary.main;
	if (!shade) return paletteGroup.main || theme.palette.primary.main;
	return paletteGroup[shade] || paletteGroup.main || theme.palette.primary.main;
};

const PasswordStrengthIndicator = ({ password }) => {
	const { label, progress, levelIndex, suggestions, isAcceptable } = useMemo(
		() => evaluatePasswordStrength(password),
		[password]
	);

	if (!password) {
		return null;
	}

	const colorKey = STRENGTH_COLORS[Math.min(levelIndex, STRENGTH_COLORS.length - 1)];
	const topSuggestion = !isAcceptable ? suggestions[0] : null;

	return (
		<Box sx={{ mt: { xs: 0.5, sm: 1 }, mb: { xs: 1, sm: 2 } }}>
			<Stack
				direction='row'
				spacing={{ xs: 0.5, sm: 1 }}
				alignItems='center'
				sx={{ mb: { xs: 0.25, sm: 0.5 }, flexWrap: 'wrap' }}
			>
				<Typography variant='caption' color='text.secondary' sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
					{`${PASSWORD_STRENGTH.LABEL}:`}
				</Typography>
				<Typography
					variant='caption'
					sx={{
						fontWeight: 600,
						color: (theme) => resolveThemeColor(theme, colorKey),
						fontSize: { xs: '0.7rem', sm: '0.75rem' },
					}}
				>
					{label}
				</Typography>
			</Stack>
			<LinearProgress
				variant='determinate'
				value={Math.round(progress * 100)}
				sx={{
					height: { xs: 4, sm: 6 },
					borderRadius: 3,
					backgroundColor: (theme) => theme.palette.grey[200],
					'& .MuiLinearProgress-bar': {
						borderRadius: 3,
						backgroundColor: (theme) => resolveThemeColor(theme, colorKey),
					},
				}}
			/>
			{/* {topSuggestion && (
				<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
					{topSuggestion}
				</Typography>
			)} */}
		</Box>
	);
};

export default PasswordStrengthIndicator;

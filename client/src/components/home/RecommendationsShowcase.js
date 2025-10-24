import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Chip, Grid2, Paper, Stack, Typography } from '@mui/material';
import { HOME } from '../../constants';

const HOME_RECOMMENDATIONS = HOME?.recommendations ?? { default_filters: [], default_items: {} };
const DEFAULT_FILTERS = HOME_RECOMMENDATIONS.default_filters ?? [];
const DEFAULT_RECOMMENDATIONS = HOME_RECOMMENDATIONS.default_items ?? {};

const RecommendationsShowcase = () => {
	const theme = useTheme();
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);

	useEffect(() => {
		setFilters(DEFAULT_FILTERS);
		setRecommendations(DEFAULT_RECOMMENDATIONS);
	}, []);

	const availableFilters = useMemo(
		() => filters.filter((filter) => (recommendations[filter.key] ?? []).length > 0),
		[filters, recommendations]
	);
	const [activeFilter, setActiveFilter] = useState(availableFilters[0]?.key ?? '');

	useEffect(() => {
		if (!availableFilters.some((filter) => filter.key === activeFilter)) {
			const fallbackKey = availableFilters[0]?.key ?? '';
			if (fallbackKey !== activeFilter) {
				setActiveFilter(fallbackKey);
			}
		}
	}, [availableFilters, activeFilter]);

	const currentItems = useMemo(() => {
		if (!activeFilter) return [];
		return recommendations[activeFilter] ?? [];
	}, [recommendations, activeFilter]);

	if (availableFilters.length === 0) return null;

	return (
		<Box component='section' sx={{ width: '100%' }}>
			<Stack spacing={{ xs: 2.5, md: 3 }}>
				<Stack direction='row' spacing={{ xs: 0.75, sm: 1 }} flexWrap='wrap' sx={{ gap: { xs: 0.75, sm: 1 } }}>
					{availableFilters.map((filter) => {
						const isActive = filter.key === activeFilter;
						return (
							<Chip
								key={filter.key}
								label={filter.label}
								color={isActive ? 'primary' : 'default'}
								variant={isActive ? 'filled' : 'outlined'}
								onClick={() => setActiveFilter(filter.key)}
								sx={{
									fontWeight: isActive ? 600 : 500,
									fontSize: { xs: '0.8rem', sm: '0.8125rem' },
									height: { xs: 28, sm: 32 },
								}}
							/>
						);
					})}
				</Stack>
				<Grid2 container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
					{currentItems.map((item) => (
						<Grid2 item xs={12} sm={6} md={3} key={item.id}>
							<Paper
								elevation={0}
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
									gap: { xs: 1.5, sm: 2 },
									height: '100%',
									minHeight: { xs: 200, sm: 240, md: 280 },
									overflow: 'hidden',
									borderRadius: { xs: 2, md: 3 },
									backgroundImage: `linear-gradient(165deg, rgba(7,11,25,0.82) 0%, rgba(7,11,25,0.38) 65%), url(${item.image})`,
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									color: '#fff',
									padding: { xs: theme.spacing(2.5), sm: theme.spacing(3) },
									transition: 'transform .4s ease, box-shadow .4s ease',
									cursor: 'pointer',
									'&:hover': {
										transform: { xs: 'translateY(-4px)', md: 'translateY(-6px)' },
										boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.28)}`,
									},
									'&:active': {
										transform: { xs: 'translateY(-2px)', md: 'translateY(-4px)' },
									},
								}}
							>
								<Stack spacing={{ xs: 1, sm: 1.5 }}>
									<Typography
										variant='overline'
										sx={{
											color: alpha('#ffffff', 0.85),
											letterSpacing: 0.6,
											fontSize: { xs: '0.7rem', sm: '0.75rem' },
										}}
									>
										{item.duration}
									</Typography>
									<Typography
										variant='h6'
										sx={{
											fontWeight: 700,
											fontSize: { xs: '1.1rem', sm: '1.25rem' },
										}}
									>
										{item.city}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: alpha('#ffffff', 0.9),
											fontSize: { xs: '0.8rem', sm: '0.875rem' },
											lineHeight: 1.5,
										}}
									>
										{item.subtitle}
									</Typography>
								</Stack>
								<Stack spacing={1}>
									<Typography
										variant='subtitle1'
										sx={{
											fontWeight: 600,
											fontSize: { xs: '0.95rem', sm: '1rem' },
										}}
									>
										{item.price}
									</Typography>
								</Stack>
							</Paper>
						</Grid2>
					))}
				</Grid2>
			</Stack>
		</Box>
	);
};

export default RecommendationsShowcase;

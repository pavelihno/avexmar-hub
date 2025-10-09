import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';

const DEFAULT_FILTERS = [
	{ key: 'popular', label: 'Популярные сейчас' },
	{ key: 'weekend', label: 'На выходные' },
	{ key: 'family', label: 'Для семьи' },
	{ key: 'culture', label: 'Город и культура' },
];

const DEFAULT_RECOMMENDATIONS = {
	popular: [
		{
			id: 'popular-istanbul',
			city: 'Стамбул',
			subtitle: 'Уикенд у Босфора',
			price: 'от 13 500 ₽',
			duration: '5 ч в пути',
			image: 'https://images.unsplash.com/photo-1473957722956-b8e1d4e1f2c4?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'popular-tbilisi',
			city: 'Тбилиси',
			subtitle: 'Вино, гастрономия и термальные бани',
			price: 'от 11 200 ₽',
			duration: '3 ч 20 мин',
			image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'popular-dubai',
			city: 'Дубай',
			subtitle: 'Шопинг и небоскребы',
			price: 'от 21 900 ₽',
			duration: '5 ч 40 мин',
			image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'popular-larnaca',
			city: 'Ларнака',
			subtitle: 'Мягкое море и солнце',
			price: 'от 17 800 ₽',
			duration: '4 ч 50 мин',
			image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
		},
	],
	weekend: [
		{
			id: 'weekend-kazan',
			city: 'Казань',
			subtitle: 'Волга, панорамы и гастрономия',
			price: 'от 4 900 ₽',
			duration: '1 ч 25 мин',
			image: 'https://images.unsplash.com/photo-1610429327123-9aa832895c0f?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'weekend-pskov',
			city: 'Псков',
			subtitle: 'История и неспешные прогулки',
			price: 'от 3 700 ₽',
			duration: '1 ч 40 мин',
			image: 'https://images.unsplash.com/photo-1600343156924-21c26c9540ce?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'weekend-murmansk',
			city: 'Мурманск',
			subtitle: 'Фьорды, китовые сафари и тундра',
			price: 'от 8 300 ₽',
			duration: '2 ч 10 мин',
			image: 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e3?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'weekend-baku',
			city: 'Баку',
			subtitle: 'Современность и восточная атмосфера',
			price: 'от 9 600 ₽',
			duration: '2 ч 50 мин',
			image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
		},
	],
	family: [
		{
			id: 'family-sochi',
			city: 'Сочи',
			subtitle: 'Парки, море и джазовые вечера',
			price: 'от 6 400 ₽',
			duration: '2 ч 25 мин',
			image: 'https://images.unsplash.com/photo-1518552782250-3ca352ec62c5?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'family-minsk',
			city: 'Минск',
			subtitle: 'Парк развлечений и комфортные отели',
			price: 'от 5 500 ₽',
			duration: '1 ч 50 мин',
			image: 'https://images.unsplash.com/photo-1573481047955-5491d09d79dd?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'family-tivat',
			city: 'Тиват',
			subtitle: 'Адриатика и зеленые бухты',
			price: 'от 18 900 ₽',
			duration: '4 ч 10 мин',
			image: 'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'family-bishkek',
			city: 'Бишкек',
			subtitle: 'Горы, озера и этно-кэмпы',
			price: 'от 12 700 ₽',
			duration: '3 ч 45 мин',
			image: 'https://images.unsplash.com/photo-1572274408440-905f0f7c9cd5?auto=format&fit=crop&w=1200&q=80',
		},
	],
	culture: [
		{
			id: 'culture-rome',
			city: 'Рим',
			subtitle: 'Колизей, музеи и кофе на террасах',
			price: 'от 23 600 ₽',
			duration: '5 ч 20 мин',
			image: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'culture-prague',
			city: 'Прага',
			subtitle: 'Готические улицы и джаз на барже',
			price: 'от 18 100 ₽',
			duration: '4 ч 40 мин',
			image: 'https://images.unsplash.com/photo-1499510030009-4395efbf22c1?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'culture-samara',
			city: 'Самара',
			subtitle: 'Волга, модерн и архитектурные прогулки',
			price: 'от 4 200 ₽',
			duration: '1 ч 50 мин',
			image: 'https://images.unsplash.com/photo-1514544250970-667a17d4d297?auto=format&fit=crop&w=1200&q=80',
		},
		{
			id: 'culture-yerevan',
			city: 'Ереван',
			subtitle: 'Винодельни, арт-кафе и горные виды',
			price: 'от 10 900 ₽',
			duration: '3 ч 05 мин',
			image: 'https://images.unsplash.com/photo-1613397645110-2a0473e14f28?auto=format&fit=crop&w=1200&q=80',
		},
	],
};

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
				<Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
					{currentItems.map((item) => (
						<Grid item xs={12} sm={6} md={3} key={item.id}>
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
						</Grid>
					))}
				</Grid>
			</Stack>
		</Box>
	);
};

export default RecommendationsShowcase;

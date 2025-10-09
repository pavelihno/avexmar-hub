import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import { UI_LABELS } from '../../constants';
import { formatDuration } from '../utils';
import { fetchCarouselSlides } from '../../redux/actions/carouselSlide';

const AUTO_SCROLL_DELAY = 6000;
const SWIPE_THRESHOLD = 50;

function transformSlides(items = []) {
	return items
		.slice()
		.sort((a, b) => {
			const orderA = a?.display_order ?? 0;
			const orderB = b?.display_order ?? 0;
			return orderA - orderB;
		})
		.map((item, index) => {
			const source = item ?? {};
			const image = source.image_url;
			const metrics = source.metrics || {};
			if (!image) return null;

			return {
				id: source.id,
				badge: source.badge || '',
				title: source.title || '',
				description: source.description || '',
				image: image,
				alt: source.alt || '',
				priceText: UI_LABELS.HOME.poster_carousel.price_from(metrics.price_from, metrics.currency),
				durationText: formatDuration(metrics.duration_minutes),
			};
		})
		.filter(Boolean);
}

const PosterCarousel = () => {
	const dispatch = useDispatch();

	const { carouselSlides: carouselSlidesData } = useSelector((state) => state.carouselSlides);
	const slides = useMemo(() => transformSlides(carouselSlidesData), [carouselSlidesData]);
	const slidesCount = slides.length;

	const [index, setIndex] = useState(0);
	const [isPaused, setPaused] = useState(false);

	const timerRef = useRef(null);
	const touchStartX = useRef(null);
	const touchDeltaX = useRef(0);
	const theme = useTheme();

	useEffect(() => {
		dispatch(fetchCarouselSlides());
	}, [dispatch]);

	useEffect(() => {
		setIndex(0);
	}, [slidesCount]);

	useEffect(() => {
		if (slidesCount === 0) return;
		if (index >= slidesCount) {
			setIndex(0);
		}
	}, [slidesCount, index]);

	useEffect(() => {
		if (slidesCount === 0 || isPaused) return;
		timerRef.current = setInterval(() => {
			setIndex((prev) => (prev + 1) % slidesCount);
		}, AUTO_SCROLL_DELAY);
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [isPaused, slidesCount]);

	const handleChange = (newIndex) => {
		if (slidesCount === 0) return;
		setIndex((newIndex + slidesCount) % slidesCount);
	};

	const onTouchStart = (event) => {
		if (event.touches && event.touches.length === 1) {
			touchStartX.current = event.touches[0].clientX;
			touchDeltaX.current = 0;
		}
	};

	const onTouchMove = (event) => {
		if (touchStartX.current != null && event.touches && event.touches.length === 1) {
			touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
		}
	};

	const onTouchEnd = () => {
		if (Math.abs(touchDeltaX.current) > SWIPE_THRESHOLD) {
			if (touchDeltaX.current > 0) handleChange(index - 1);
			else handleChange(index + 1);
		}
		touchStartX.current = null;
	};

	return (
		<Box
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			sx={{
				position: 'relative',
				width: '100%',
				aspectRatio: { xs: '4 / 5', sm: '16 / 9', md: '21 / 9' },
				minHeight: { xs: 420, sm: 360, md: 420 },
				borderRadius: { xs: 2, md: 3 },
				overflow: 'hidden',
				backgroundColor: 'background.paper',
				boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.28)}`,
				'&:hover .carouselNav': { opacity: 1, transform: 'translateY(-50%) scale(1)' },
			}}
		>
			<Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
				{slides.map((item, i) => {
					const active = i === index;
					return (
						<Paper
							key={item.id}
							elevation={0}
							sx={{
								position: 'absolute',
								inset: 0,
								opacity: active ? 1 : 0,
								transform: active ? 'translateY(0)' : 'translateY(24px)',
								transition: 'opacity 500ms ease, transform 500ms ease',
								borderRadius: { xs: 2, md: 3 },
								overflow: 'hidden',
								pointerEvents: active ? 'auto' : 'none',
							}}
						>
							<Box
								component='img'
								src={item.image}
								alt={item.alt || item.title}
								sx={{
									position: 'absolute',
									inset: 0,
									width: '100%',
									height: '100%',
									objectFit: 'cover',
								}}
							/>
							<Box
								sx={{
									position: 'absolute',
									inset: 0,
									background:
										'linear-gradient(135deg, rgba(2,6,24,0.82) 0%, rgba(8,21,62,0.55) 55%, rgba(13,53,90,0.6) 100%)',
								}}
							/>
							<Stack
								sx={{
									position: 'relative',
									zIndex: 1,
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
									gap: { xs: 2, sm: 3, md: 4 },
									p: { xs: 2.5, sm: 3, md: 4 },
									color: '#fff',
								}}
							>
								<Stack spacing={{ xs: 1.5, sm: 2 }}>
									{item.badge && (
										<Chip
											label={item.badge}
											size='small'
											sx={{
												alignSelf: 'flex-start',
												bgcolor: alpha('#ffffff', 0.18),
												color: '#fff',
												fontWeight: 600,
												fontSize: { xs: '0.7rem', sm: '0.75rem' },
												height: { xs: 22, sm: 24 },
											}}
										/>
									)}
									<Typography
										variant='h4'
										component='h3'
										sx={{
											color: '#ffffff',
											fontWeight: 700,
											lineHeight: 1.15,
											fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
										}}
									>
										{item.title}
									</Typography>
									{item.description && (
										<Typography
											variant='body2'
											sx={{
												maxWidth: 440,
												color: alpha('#ffffff', 0.8),
												fontSize: { xs: '0.8rem', sm: '0.875rem' },
												lineHeight: 1.5,
											}}
										>
											{item.description}
										</Typography>
									)}
								</Stack>
								<Stack
									direction={{ xs: 'column', sm: 'column' }}
									alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
									spacing={0.5}
								>
									{item.priceText && (
										<Typography
											variant='subtitle1'
											sx={{
												fontWeight: 600,
												fontSize: { xs: '0.95rem', sm: '1rem' },
											}}
										>
											{item.priceText}
										</Typography>
									)}
									{item.durationText && (
										<Typography
											variant='body2'
											sx={{
												color: alpha('#ffffff', 0.78),
												fontSize: { xs: '0.8rem', sm: '0.875rem' },
											}}
										>
											{item.durationText}
										</Typography>
									)}
								</Stack>
							</Stack>
						</Paper>
					);
				})}
			</Box>

			<IconButton
				onClick={() => handleChange(index - 1)}
				className='carouselNav'
				sx={{
					position: 'absolute',
					top: '50%',
					left: 12,
					transform: 'translateY(-50%) scale(0.92)',
					color: '#fff',
					backgroundColor: alpha('#0d1a2a', 0.6),
					border: `1px solid ${alpha('#ffffff', 0.18)}`,
					transition: 'background-color .25s ease, opacity .3s ease, transform .3s ease',
					opacity: 0,
					display: { xs: 'none', sm: 'inline-flex' },
					'&:hover': { backgroundColor: alpha('#0d1a2a', 0.82) },
				}}
				size='small'
			>
				<ArrowBackIosNew fontSize='inherit' />
			</IconButton>
			<IconButton
				onClick={() => handleChange(index + 1)}
				className='carouselNav'
				sx={{
					position: 'absolute',
					top: '50%',
					right: 12,
					transform: 'translateY(-50%) scale(0.92)',
					color: '#fff',
					backgroundColor: alpha('#0d1a2a', 0.6),
					border: `1px solid ${alpha('#ffffff', 0.18)}`,
					transition: 'background-color .25s ease, opacity .3s ease, transform .3s ease',
					opacity: 0,
					display: { xs: 'none', sm: 'inline-flex' },
					'&:hover': { backgroundColor: alpha('#0d1a2a', 0.82) },
				}}
				size='small'
			>
				<ArrowForwardIos fontSize='inherit' />
			</IconButton>

			<Stack
				direction='row'
				spacing={{ xs: 0.5, sm: 0.75 }}
				sx={{
					position: 'absolute',
					bottom: { xs: 12, sm: 14 },
					left: '50%',
					transform: 'translateX(-50%)',
					alignItems: 'center',
					px: 2,
				}}
			>
				{slides.map((item, i) => {
					const active = i === index;
					return (
						<Box
							key={item.id}
							onClick={() => handleChange(i)}
							role='button'
							aria-label={`Перейти к слайду ${i + 1}`}
							tabIndex={0}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									handleChange(i);
								}
							}}
							sx={{
								width: active ? { xs: 20, sm: 26 } : { xs: 10, sm: 12 },
								height: { xs: 5, sm: 6 },
								borderRadius: 999,
								cursor: 'pointer',
								transition: 'width .4s ease, background-color .3s ease',
								backgroundColor: active ? alpha('#ffffff', 0.9) : alpha('#ffffff', 0.4),
								minWidth: { xs: 10, sm: 12 },
							}}
						/>
					);
				})}
			</Stack>
		</Box>
	);
};

export default PosterCarousel;

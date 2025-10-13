import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import { HOME } from '../../constants';
import { formatDuration } from '../utils';
import { fetchCarouselSlides } from '../../redux/actions/carouselSlide';

const AUTO_SCROLL_DELAY = 6000;
const SWIPE_THRESHOLD = 50;

const getAirportCode = (airport) => {
	if (!airport) return '';
	return airport.iata_code || '';
};

const getLocationLabel = (airport) => {
	if (!airport) return '';
	const parts = [];
	if (airport.city_name) parts.push(airport.city_name);
	else if (airport.name) parts.push(airport.name);

	const code = getAirportCode(airport);
	if (code) parts.push(`(${code})`);
	return parts.join(' ').trim();
};

export function transformSlides(items = [], { includeInactive = false } = {}) {
	return items
		.filter((item) => {
			if (!item) return false;
			if (!includeInactive && item.is_active === false) return false;
			return true;
		})
		.slice()
		.sort((a, b) => {
			const orderA = a?.display_order ?? 0;
			const orderB = b?.display_order ?? 0;
			return orderA - orderB;
		})
		.map((item, index) => {
			const source = item ?? {};
			const image = source.image_url;
			const metrics = source.route_metrics || {};
			if (!image) return null;

			const routeDetails = source.route || {};
			const originAirport = routeDetails.origin_airport || {};
			const destinationAirport = routeDetails.destination_airport || {};
			const originCode = getAirportCode(originAirport);
			const destinationCode = getAirportCode(destinationAirport);
			const originLabel = getLocationLabel(originAirport) || originCode;
			const destinationLabel = getLocationLabel(destinationAirport) || destinationCode;

			let routeInfo = null;
			if (originCode && destinationCode) {
				routeInfo = {
					fromCode: originCode,
					toCode: destinationCode,
					originLabel,
					destinationLabel,
					summary: `${originLabel} → ${destinationLabel}`,
					ctaText: HOME.poster_carousel.schedule_cta(originLabel, destinationLabel),
					path: `/schedule?from=${encodeURIComponent(originCode)}&to=${encodeURIComponent(destinationCode)}`,
				};
			}

			return {
				id: source.id,
				badge: source.badge || '',
				title: source.title || '',
				description: source.description || '',
				image: image,
				alt: source.alt || '',
				priceText: HOME.poster_carousel.price_from(metrics.price_from, metrics.currency),
				durationText: formatDuration(metrics.duration_minutes),
				routeInfo,
			};
		})
		.filter(Boolean);
}

const PosterCarousel = ({
	slides: externalSlides = null,
	autoFetch = true,
	autoPlay = true,
	includeInactive = false,
	sx = null,
}) => {
	const dispatch = useDispatch();

	const { carouselSlides: carouselSlidesData } = useSelector((state) => state.carouselSlides);
	const sourceSlides = externalSlides ?? carouselSlidesData;
	const slides = useMemo(() => transformSlides(sourceSlides, { includeInactive }), [sourceSlides, includeInactive]);
	const slidesCount = slides.length;

	const [index, setIndex] = useState(0);
	const [isPaused, setPaused] = useState(false);
	const navigate = useNavigate();

	const timerRef = useRef(null);
	const touchStartX = useRef(null);
	const touchDeltaX = useRef(0);
	const theme = useTheme();

	useEffect(() => {
		if (!autoFetch || externalSlides) return;
		dispatch(fetchCarouselSlides());
	}, [dispatch, autoFetch, externalSlides]);

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
		if (!autoPlay || slidesCount === 0 || isPaused) return;
		timerRef.current = setInterval(() => {
			setIndex((prev) => (prev + 1) % slidesCount);
		}, AUTO_SCROLL_DELAY);
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [autoPlay, isPaused, slidesCount]);

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

	if (slidesCount === 0) {
		return null;
	}

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
				...(sx || {}),
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
									{item.routeInfo && (
										<Button
											variant='outlined'
											size='small'
											color='inherit'
											onClick={() => navigate(item.routeInfo.path)}
											endIcon={<ArrowForwardIos sx={{ fontSize: '0.75rem' }} />}
											sx={{
												alignSelf: 'flex-start',
												mt: { xs: 0.5, sm: 0.75 },
												color: '#fff',
												borderColor: alpha('#ffffff', 0.4),
												bgcolor: alpha('#ffffff', 0.08),
												fontWeight: 600,
												textTransform: 'none',
												borderRadius: 999,
												px: 2,
												'&:hover': {
													bgcolor: alpha('#ffffff', 0.18),
													borderColor: alpha('#ffffff', 0.6),
												},
												'& .MuiButton-endIcon': { ml: 1 },
											}}
										>
											{item.routeInfo.ctaText}
										</Button>
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

			{slidesCount > 1 && (
				<>
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
									aria-label={HOME.poster_carousel.go_to_slide(i + 1)}
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
				</>
			)}
		</Box>
	);
};

export default PosterCarousel;

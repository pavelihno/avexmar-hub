import React, { useEffect, useState, useRef } from 'react';
import { Box, Link, IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import POSTERS from '../../constants/posters';

const PosterCarousel = () => {
	const [index, setIndex] = useState(0);
	const [isPaused, setPaused] = useState(false);
	const timerRef = useRef(null);
	const touchStartX = useRef(null);
	const touchDeltaX = useRef(0);

	useEffect(() => {
		if (isPaused) return;
		timerRef.current = setInterval(() => {
			setIndex((prev) => (prev + 1) % POSTERS.length);
		}, 5000);
		return () => clearInterval(timerRef.current);
	}, [isPaused]);

	const handleChange = (newIndex) => {
		setIndex((newIndex + POSTERS.length) % POSTERS.length);
	};

	const onTouchStart = (e) => {
		if (e.touches && e.touches.length === 1) {
			touchStartX.current = e.touches[0].clientX;
			touchDeltaX.current = 0;
		}
	};
	const onTouchMove = (e) => {
		if (touchStartX.current != null && e.touches && e.touches.length === 1) {
			touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
		}
	};
	const onTouchEnd = () => {
		const threshold = 40; // minimal px for swipe
		if (Math.abs(touchDeltaX.current) > threshold) {
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
				aspectRatio: '3 / 2',
				maxHeight: { md: 512 },
				width: '100%',
				overflow: 'hidden',
				borderRadius: 1,
				border: (theme) => `1px solid ${theme.palette.divider}`,
				boxShadow: 'none',
				backgroundColor: 'background.paper',
				'&:hover .navButton': { opacity: 1 },
			}}
		>
			{/* Accessibility live region */}
			<Box
				component='span'
				sx={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
				aria-live='polite'
			>
				Slide {index + 1} of {POSTERS.length}
			</Box>
			{/* Slides */}
			<Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
				{POSTERS.map((poster, i) => {
					const active = i === index;
					return (
						<Box
							key={i}
							component={Link}
							href={poster.href}
							sx={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								textDecoration: 'none',
								transition: 'opacity 600ms ease',
								opacity: active ? 1 : 0,
							}}
						>
							<Box
								component='img'
								loading='lazy'
								src={poster.src}
								alt={poster.alt}
								sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
							/>
							{/* Subtle bottom gradient */}
							<Box
								sx={{
									position: 'absolute',
									inset: 0,
									background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.15) 100%)',
									pointerEvents: 'none',
								}}
							/>
						</Box>
					);
				})}
			</Box>

			{/* Navigation Buttons */}
			<IconButton
				onClick={() => handleChange(index - 1)}
				className='navButton'
				sx={{
					position: 'absolute',
					top: '50%',
					left: 8,
					transform: 'translateY(-50%)',
					color: 'text.primary',
					backgroundColor: 'rgba(255,255,255,0.6)',
					border: (theme) => `1px solid ${theme.palette.divider}`,
					transition: 'background-color .25s ease, opacity .3s ease',
					opacity: 0,
					display: { xs: 'none', sm: 'inline-flex' },
				}}
				size='small'
			>
				<ArrowBackIosNew fontSize='inherit' />
			</IconButton>
			<IconButton
				onClick={() => handleChange(index + 1)}
				className='navButton'
				sx={{
					position: 'absolute',
					top: '50%',
					right: 8,
					transform: 'translateY(-50%)',
					color: 'text.primary',
					backgroundColor: 'rgba(255,255,255,0.6)',
					border: (theme) => `1px solid ${theme.palette.divider}`,
					transition: 'background-color .25s ease, opacity .3s ease',
					opacity: 0,
					display: { xs: 'none', sm: 'inline-flex' },
				}}
				size='small'
			>
				<ArrowForwardIos fontSize='inherit' />
			</IconButton>

			{/* Indicators */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 10,
					left: '50%',
					transform: 'translateX(-50%)',
					display: 'flex',
					gap: { xs: 0.6, sm: 1 },
				}}
			>
				{POSTERS.map((_, i) => {
					const active = i === index;
					return (
						<Box
							key={i}
							onClick={() => handleChange(i)}
							role='button'
							aria-label={`Go to slide ${i + 1}`}
							sx={{
								width: { xs: 8, sm: 10 },
								height: { xs: 8, sm: 10 },
								borderRadius: '50%',
								cursor: 'pointer',
								transition: 'transform .3s ease, background-color .3s ease',
								backgroundColor: active ? 'primary.main' : 'rgba(0,0,0,0.25)',
								transform: active ? 'scale(1.35)' : 'scale(1)',
								'&:hover': { backgroundColor: 'primary.main' },
							}}
						/>
					);
				})}
			</Box>
		</Box>
	);
};

export default PosterCarousel;

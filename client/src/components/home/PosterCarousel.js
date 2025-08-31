import React, { useEffect, useState } from 'react';
import { Box, Link, Typography } from '@mui/material';
import POSTERS from '../../constants/posters';

const PosterCarousel = () => {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setIndex((prev) => (prev + 1) % POSTERS.length);
		}, 5000);
		return () => clearInterval(id);
	}, []);

	const poster = POSTERS[index];

	return (
		<Box sx={{ position: 'relative', width: '100%', height: { xs: 150, sm: 200 }, overflow: 'hidden' }}>
			<Link href={poster.href} sx={{ display: 'block', width: '100%', height: '100%' }}>
				<Box
					component='img'
					src={poster.src}
					alt={poster.title}
					sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
				/>
				<Typography
					variant='h5'
					sx={{
						position: 'absolute',
						bottom: 16,
						left: 16,
						color: '#fff',
						textShadow: '0 0 4px rgba(0,0,0,0.6)',
					}}
				>
					{poster.title}
				</Typography>
			</Link>
		</Box>
	);
};

export default PosterCarousel;

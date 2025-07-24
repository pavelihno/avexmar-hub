import React from 'react';
import { useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Base from './Base';
import UI_LABELS from '../constants/uiLabels';

const Home = () => {
	const dispatch = useDispatch();

	return (
		<Base>
			<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
				<Box
					sx={{
						display: 'flex',
						background: '#fff',
						borderRadius: 3,
						boxShadow: 1,
						p: 1,
						gap: 0,
					}}
				>
					{/* Откуда */}
					<Box sx={{ px: 3, py: 2, minWidth: 150 }}>
						<Typography variant='h6' sx={{ color: '#b0b0b0', fontSize: 18 }}>
							{UI_LABELS.HOME.search.from}
						</Typography>
					</Box>
					{/* Куда */}
					<Box sx={{ px: 3, py: 2, minWidth: 150, borderLeft: '1px solid #e0e0e0' }}>
						<Typography variant='h6' sx={{ color: '#b0b0b0', fontSize: 18 }}>
							{UI_LABELS.HOME.search.to}
						</Typography>
					</Box>
					{/* Когда */}
					<Box sx={{ px: 3, py: 2, minWidth: 150, borderLeft: '1px solid #e0e0e0' }}>
						<Typography variant='h6' sx={{ color: '#b0b0b0', fontSize: 18 }}>
							{UI_LABELS.HOME.search.when}
						</Typography>
					</Box>
					{/* Обратно */}
					<Box sx={{ px: 3, py: 2, minWidth: 150, borderLeft: '1px solid #e0e0e0' }}>
						<Typography variant='h6' sx={{ color: '#b0b0b0', fontSize: 18 }}>
							{UI_LABELS.HOME.search.return}
						</Typography>
					</Box>
					{/* Кто летит */}
					<Box sx={{ px: 3, py: 2, minWidth: 180, borderLeft: '1px solid #e0e0e0' }}>
						<Typography variant='h6' sx={{ fontSize: 18 }}>
							{UI_LABELS.HOME.search.passengers}
						</Typography>
						<Typography variant='body2' sx={{ color: '#b0b0b0', fontSize: 14 }}>
							{UI_LABELS.HOME.search.class}
						</Typography>
					</Box>
					{/* Найти билеты */}
					<Box sx={{ px: 0, py: 1, ml: 2, display: 'flex', alignItems: 'center' }}>
						<Button
							variant='contained'
							sx={{
								background: '#ff7f2a',
								color: '#fff',
								borderRadius: 2,
								px: 4,
								py: 2,
								fontSize: 20,
								fontWeight: 600,
								boxShadow: 'none',
								'&:hover': { background: '#ff6600' },
							}}
						>
							{UI_LABELS.HOME.search.button}
						</Button>
					</Box>
				</Box>
			</Box>
		</Base>
	);
};

export default Home;

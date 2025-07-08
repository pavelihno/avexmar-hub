import React from 'react';
import { Link } from 'react-router-dom';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Grid,
	CardActionArea,
} from '@mui/material';
import AirportIcon from '@mui/icons-material/LocalAirport';
import RouteIcon from '@mui/icons-material/Route';
import DiscountIcon from '@mui/icons-material/Discount';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import Base from '../Base';

const AdminPanel = () => {
	const adminModules = [
		{
			title: 'Аэропорты',
			description: 'Управление аэропортами',
			icon: <AirportIcon sx={{ fontSize: 50 }} />,
			path: '/admin/airports',
		},
		{
			title: 'Маршруты',
			description: 'Управление маршрутами',
			icon: <RouteIcon sx={{ fontSize: 50 }} />,
			path: '/admin/routes',
		},
		{
			title: 'Скидки',
			description: 'Управление скидками',
			icon: <DiscountIcon sx={{ fontSize: 50 }} />,
			path: '/admin/discounts',
		},
		{
			title: 'Рейсы и тарифы',
			description: 'Управление рейсами и тарифами',
			icon: <FlightTakeoffIcon sx={{ fontSize: 50 }} />,
			path: '/admin/flights',
		},
	];

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Typography variant='h4' sx={{ mb: 4 }}>
					Панель администратора
				</Typography>

				<Grid container spacing={3}>
					{adminModules.map((module, index) => (
						<Grid item xs={12} sm={6} md={3} key={index}>
							<Card sx={{ height: '100%' }}>
								<CardActionArea
									component={Link}
									to={module.path}
									sx={{
										height: '100%',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
								>
									<CardContent sx={{ textAlign: 'center' }}>
										{module.icon}
										<Typography variant='h6' sx={{ mt: 2 }}>
											{module.title}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{module.description}
										</Typography>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
				</Grid>
			</Box>
		</Base>
	);
};

export default AdminPanel;

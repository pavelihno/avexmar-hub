import React from 'react';
import { Link } from 'react-router-dom';

import { Box, Typography, Card, CardContent, Grid, CardActionArea } from '@mui/material';
import AirportIcon from '@mui/icons-material/LocalAirport';
import RouteIcon from '@mui/icons-material/Route';
import DiscountIcon from '@mui/icons-material/Discount';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import HailIcon from '@mui/icons-material/Hail';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AirlinesIcon from '@mui/icons-material/Airlines';
import PublicIcon from '@mui/icons-material/Public';

import Base from '../Base';

import { UI_LABELS } from '../../constants';

const AdminPanel = () => {
	const adminModules = [
		{
			title: UI_LABELS.ADMIN.modules.countries.title,
			description: UI_LABELS.ADMIN.modules.countries.description,
			icon: <PublicIcon sx={{ fontSize: 50 }} />,
			path: '/admin/countries',
		},
		{
			title: UI_LABELS.ADMIN.modules.airports.title,
			description: UI_LABELS.ADMIN.modules.airports.description,
			icon: <AirportIcon sx={{ fontSize: 50 }} />,
			path: '/admin/airports',
		},
		{
			title: UI_LABELS.ADMIN.modules.airlines.title,
			description: UI_LABELS.ADMIN.modules.airlines.description,
			icon: <AirlinesIcon sx={{ fontSize: 50 }} />,
			path: '/admin/airlines',
		},
		{
			title: UI_LABELS.ADMIN.modules.routes.title,
			description: UI_LABELS.ADMIN.modules.routes.description,
			icon: <RouteIcon sx={{ fontSize: 50 }} />,
			path: '/admin/routes',
		},
		{
			title: UI_LABELS.ADMIN.modules.discounts.title,
			description: UI_LABELS.ADMIN.modules.discounts.description,
			icon: <DiscountIcon sx={{ fontSize: 50 }} />,
			path: '/admin/discounts',
		},
		{
			title: UI_LABELS.ADMIN.modules.tariffs.title,
			description: UI_LABELS.ADMIN.modules.tariffs.description,
			icon: <MonetizationOnIcon sx={{ fontSize: 50 }} />,
			path: '/admin/tariffs',
		},
		{
			title: UI_LABELS.ADMIN.modules.flights.title,
			description: UI_LABELS.ADMIN.modules.flights.description,
			icon: <FlightTakeoffIcon sx={{ fontSize: 50 }} />,
			path: '/admin/flights',
		},
		{
			title: UI_LABELS.ADMIN.modules.bookings.title,
			description: UI_LABELS.ADMIN.modules.bookings.description,
			icon: <BookOnlineIcon sx={{ fontSize: 50 }} />,
			path: '/admin/bookings',
		},
		{
			title: UI_LABELS.ADMIN.modules.passengers.title,
			description: UI_LABELS.ADMIN.modules.passengers.description,
			icon: <HailIcon sx={{ fontSize: 50 }} />,
			path: '/admin/passengers',
		},
		{
			title: UI_LABELS.ADMIN.modules.tickets.title,
			description: UI_LABELS.ADMIN.modules.tickets.description,
			icon: <AirplaneTicketIcon sx={{ fontSize: 50 }} />,
			path: '/admin/tickets',
		},
		{
			title: UI_LABELS.ADMIN.modules.users.title,
			description: UI_LABELS.ADMIN.modules.users.description,
			icon: <ManageAccountsIcon sx={{ fontSize: 50 }} />,
			path: '/admin/users',
		},
	];

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Typography variant='h3' sx={{ mb: 4 }}>
					{UI_LABELS.ADMIN.panel}
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
										<Typography variant='body2' color='text.secondary'>
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

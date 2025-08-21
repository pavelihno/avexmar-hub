import React from 'react';
import { Link } from 'react-router-dom';

import { Box, Typography, Card, CardContent, Grid, CardActionArea } from '@mui/material';
import AirportIcon from '@mui/icons-material/LocalAirport';
import RouteIcon from '@mui/icons-material/Route';
import DiscountIcon from '@mui/icons-material/Discount';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import HailIcon from '@mui/icons-material/Hail';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AirlinesIcon from '@mui/icons-material/Airlines';
import PublicIcon from '@mui/icons-material/Public';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import HandshakeIcon from '@mui/icons-material/Handshake';

import Base from '../Base';

import { UI_LABELS } from '../../constants';

const iconSX = { fontSize: 50 };

const AdminPanel = () => {
	const adminModules = [
		{
			title: UI_LABELS.ADMIN.modules.countries.title,
			description: UI_LABELS.ADMIN.modules.countries.description,
			icon: <PublicIcon sx={iconSX} />,
			path: '/admin/countries',
		},
		{
			title: UI_LABELS.ADMIN.modules.timezones.title,
			description: UI_LABELS.ADMIN.modules.timezones.description,
			icon: <AccessTimeFilledIcon sx={iconSX} />,
			path: '/admin/timezones',
		},
		{
			title: UI_LABELS.ADMIN.modules.airports.title,
			description: UI_LABELS.ADMIN.modules.airports.description,
			icon: <AirportIcon sx={iconSX} />,
			path: '/admin/airports',
		},
		{
			title: UI_LABELS.ADMIN.modules.aircrafts.title,
			description: UI_LABELS.ADMIN.modules.aircrafts.description,
			icon: <ConnectingAirportsIcon sx={iconSX} />,
			path: '/admin/aircrafts',
		},
		{
			title: UI_LABELS.ADMIN.modules.airlines.title,
			description: UI_LABELS.ADMIN.modules.airlines.description,
			icon: <AirlinesIcon sx={iconSX} />,
			path: '/admin/airlines',
		},
		{
			title: UI_LABELS.ADMIN.modules.routes.title,
			description: UI_LABELS.ADMIN.modules.routes.description,
			icon: <RouteIcon sx={iconSX} />,
			path: '/admin/routes',
		},
		{
			title: UI_LABELS.ADMIN.modules.discounts.title,
			description: UI_LABELS.ADMIN.modules.discounts.description,
			icon: <DiscountIcon sx={iconSX} />,
			path: '/admin/discounts',
		},
		{
			title: UI_LABELS.ADMIN.modules.fees.title,
			description: UI_LABELS.ADMIN.modules.fees.description,
			icon: <RequestQuoteIcon sx={iconSX} />,
			path: '/admin/fees',
		},
		{
			title: UI_LABELS.ADMIN.modules.tariffs.title,
			description: UI_LABELS.ADMIN.modules.tariffs.description,
			icon: <MonetizationOnIcon sx={iconSX} />,
			path: '/admin/tariffs',
		},
		{
			title: UI_LABELS.ADMIN.modules.flights.title,
			description: UI_LABELS.ADMIN.modules.flights.description,
			icon: <FlightTakeoffIcon sx={iconSX} />,
			path: '/admin/flights',
		},
		{
			title: UI_LABELS.ADMIN.modules.bookings.title,
			description: UI_LABELS.ADMIN.modules.bookings.description,
			icon: <BookOnlineIcon sx={iconSX} />,
			path: '/admin/bookings',
		},
		{
			title: UI_LABELS.ADMIN.modules.passengers.title,
			description: UI_LABELS.ADMIN.modules.passengers.description,
			icon: <HailIcon sx={iconSX} />,
			path: '/admin/passengers',
		},
		{
			title: UI_LABELS.ADMIN.modules.payments.title,
			description: UI_LABELS.ADMIN.modules.payments.description,
			icon: <PaymentIcon sx={iconSX} />,
			path: '/admin/payments',
		},
		{
			title: UI_LABELS.ADMIN.modules.tickets.title,
			description: UI_LABELS.ADMIN.modules.tickets.description,
			icon: <AirplaneTicketIcon sx={iconSX} />,
			path: '/admin/tickets',
		},
		{
			title: UI_LABELS.ADMIN.modules.users.title,
			description: UI_LABELS.ADMIN.modules.users.description,
			icon: <ManageAccountsIcon sx={iconSX} />,
			path: '/admin/users',
		},
		{
			title: UI_LABELS.ADMIN.modules.consentDocs.title,
			description: UI_LABELS.ADMIN.modules.consentDocs.description,
			icon: <DescriptionIcon sx={iconSX} />,
			path: '/admin/consent-docs',
		},
		{
			title: UI_LABELS.ADMIN.modules.consentEvents.title,
			description: UI_LABELS.ADMIN.modules.consentEvents.description,
			icon: <HandshakeIcon sx={iconSX} />,
			path: '/admin/consent-events',
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

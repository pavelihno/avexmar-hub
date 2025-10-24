import React from 'react';
import { Grid2, Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { ENUM_LABELS } from '../../constants';
import { formatDate, formatTime, formatDuration } from '../utils';

const FlightDetailsCard = ({ flights = [], tariffMap = {} }) => {
	if (!Array.isArray(flights) || flights.length === 0) {
		return null;
	}

	return (
		<Grid2 container spacing={1}>
			{flights.map((f, idx) => {
				const origin = f.route?.origin_airport || {};
				const dest = f.route?.destination_airport || {};
				const depDate = formatDate(f.scheduled_departure);
				const depTime = formatTime(f.scheduled_departure_time);
				const arrDate = formatDate(f.scheduled_arrival);
				const arrTime = formatTime(f.scheduled_arrival_time);
				const duration = formatDuration(f.duration);
				const airline = f.airline?.name || '';
				const flightNo = f.airline_flight_number || '';
				const aircraft = f.aircraft?.type;
				const direction = idx === 0 ? 'outbound' : 'return';
				const tariff = tariffMap[direction];

				return (
					<Grid2
						key={f.id || idx}
						size={{
							xs: 12,
							md: 6,
						}}
					>
						<Card>
							<CardContent>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										mb: 0.5,
									}}
								>
									<Typography variant='subtitle2'>{airline}</Typography>
									<Typography variant='caption' color='text.secondary'>
										{flightNo}
									</Typography>
								</Box>
								{tariff && (
									<Typography
										variant='caption'
										color='text.secondary'
										sx={{ mb: 0.5, display: 'block' }}
									>
										{`${ENUM_LABELS.SEAT_CLASS[tariff.seat_class]} — ${tariff.title}`}
									</Typography>
								)}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr auto 1fr',
										gap: 1,
										alignItems: 'center',
									}}
								>
									<Box>
										<Typography variant='h6'>{depTime}</Typography>
										<Typography variant='caption' color='text.secondary'>
											{depDate}
										</Typography>
										<Typography variant='body2'>{origin.city_name}</Typography>
										<Typography variant='caption' color='text.secondary'>
											{origin.iata_code}
										</Typography>
									</Box>
									<Box sx={{ textAlign: 'center' }}>
										<Typography variant='caption' color='text.secondary'>
											{duration}
										</Typography>
										<Divider flexItem sx={{ my: 0.5 }} />
									</Box>
									<Box sx={{ textAlign: 'right' }}>
										<Typography variant='h6'>{arrTime}</Typography>
										<Typography variant='caption' color='text.secondary'>
											{arrDate}
										</Typography>
										<Typography variant='body2'>{dest.city_name}</Typography>
										<Typography variant='caption' color='text.secondary'>
											{dest.iata_code}
										</Typography>
									</Box>
								</Box>
								{aircraft && (
									<Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
										<Typography variant='caption' color='text.secondary'>
											{aircraft}
										</Typography>
									</Box>
								)}
							</CardContent>
						</Card>
					</Grid2>
				);
			})}
			{flights.length === 1 && (
				<Grid2
					size={{
						xs: 12,
						md: 6,
					}}
				/>
			)}
		</Grid2>
	);
};

export default FlightDetailsCard;

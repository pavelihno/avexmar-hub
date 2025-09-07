import React from 'react';

import { Card, Box, Typography, Divider, IconButton, Skeleton, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FlightIcon from '@mui/icons-material/Flight';
import ShareIcon from '@mui/icons-material/Share';

import { ENUM_LABELS, UI_LABELS, DATE_WEEKDAY_FORMAT } from '../../constants';
import { formatDate, formatTime, formatDuration, formatNumber } from '../utils';

const SegmentSkeleton = () => {
	return (
		<Box sx={{ mb: 1 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr auto 1fr',
					alignItems: 'center',
					mb: 1,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						textAlign: 'left',
					}}
				>
					<Skeleton width={120} height={24} sx={{ mb: 0.5 }} />
					<Skeleton width={80} height={24} />
				</Box>

				<Box sx={{ textAlign: 'center' }}>
					<Skeleton width={60} height={24} />
				</Box>

				<Box sx={{ textAlign: 'right' }}>
					<Skeleton width={40} height={40} variant='circular' />
				</Box>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr auto 1fr',
					alignItems: 'center',
				}}
			>
				<Box sx={{ textAlign: 'left' }}>
					<Skeleton width={80} height={32} sx={{ mb: 0.5 }} />
					<Skeleton width={100} height={20} sx={{ mb: 0.5 }} />
					<Skeleton width={140} height={20} />
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box sx={{ borderBottom: '1px dotted', width: 50 }} />
					<Skeleton width={24} height={24} sx={{ mx: 1 }} />
					<Box sx={{ borderBottom: '1px dotted', width: 50 }} />
				</Box>

				<Box sx={{ textAlign: 'right' }}>
					<Skeleton width={80} height={32} sx={{ mb: 0.5 }} />
					<Skeleton width={100} height={20} sx={{ mb: 0.5 }} />
					<Skeleton width={140} height={20} />
				</Box>
			</Box>
		</Box>
	);
};

const Segment = ({ flight, isOutbound }) => {
	if (!flight) return null;

	const airline = flight.airline || {};
	const route = flight.route || {};
	const originAirport = route.origin_airport || {};
	const destinationAirport = route.destination_airport || {};

	return (
		<Box sx={{ mb: 1 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr auto 1fr',
					alignItems: 'center',
					mb: 1,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						textAlign: 'left',
					}}
				>
					<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
						{airline?.name ?? airline?.id}
					</Typography>
					<Typography variant='subtitle2'>{flight.airline_flight_number}</Typography>
				</Box>

				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='subtitle2'>{formatDuration(flight.duration)}</Typography>
				</Box>

				<Box sx={{ textAlign: 'right' }}>
					<IconButton size='small' onClick={() => navigator.clipboard.writeText(window.location.href)}>
						<ShareIcon fontSize='small' />
					</IconButton>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr auto 1fr',
					alignItems: 'center',
				}}
			>
				<Box sx={{ textAlign: 'left' }}>
					<Typography variant='h6' className='mono-nums'>
						{formatTime(flight.scheduled_departure_time)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{formatDate(flight.scheduled_departure, DATE_WEEKDAY_FORMAT)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{originAirport?.name ?? originAirport?.id}
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box sx={{ borderBottom: '1px dotted', width: 50 }} />
					<FlightIcon sx={{ transform: `rotate(${isOutbound ? 90 : -90}deg)`, mx: 1 }} />
					<Box sx={{ borderBottom: '1px dotted', width: 50 }} />
				</Box>

				<Box sx={{ textAlign: 'right' }}>
					<Typography variant='h6' className='mono-nums'>
						{formatTime(flight.scheduled_arrival_time)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{formatDate(flight.scheduled_arrival, DATE_WEEKDAY_FORMAT)}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{destinationAirport?.name ?? destinationAirport?.id}
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

const SearchResultCard = ({ outbound, returnFlight, isLoading }) => {
        const theme = useTheme();

	const currency = outbound?.currency || returnFlight?.currency;
	const currencySymbol = currency ? ENUM_LABELS.CURRENCY_SYMBOL[currency] : '';

	const isMinPrice = outbound?.min_price || returnFlight?.min_price;
	const totalPrice =
		(outbound?.price || outbound?.min_price || 0) + (returnFlight?.price || returnFlight?.min_price || 0);

	const priceText = isMinPrice
		? `${UI_LABELS.SEARCH.flight_details.price_from.toLowerCase()} ${formatNumber(totalPrice)} ${currencySymbol}`
		: `${formatNumber(totalPrice)} ${currencySymbol}`;

	return (
		<>
			<Card sx={{ p: 2, width: '100%' }}>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<Box
						sx={{
							width: { md: 180 },
							textAlign: 'center',
							pr: { md: 2 },
							borderRight: { md: `1px solid ${theme.palette.grey[100]}` },
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							mb: { xs: 2, md: 0 },
						}}
					>
						{isLoading ? (
							<Skeleton variant='rectangular' width={150} height={40} sx={{ mb: 1, mx: 'auto' }} />
						) : (
							<>
								<Typography variant='h5' sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
									{priceText}
								</Typography>
								<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
									{UI_LABELS.SEARCH.flight_details.price_per_passenger.toLowerCase()}
								</Typography>
							</>
						)}
					</Box>
					<Box sx={{ flexGrow: 1, pl: { md: 2 } }}>
						{isLoading ? (
							<>
								<SegmentSkeleton />
								{returnFlight && <Divider sx={{ my: 1 }} />}
								{returnFlight && <SegmentSkeleton />}
							</>
						) : (
							<>
								<Segment flight={outbound} isOutbound />
								{returnFlight && <Divider sx={{ my: 1 }} />}
								{returnFlight && <Segment flight={returnFlight} isOutbound={false} />}
							</>
						)}
					</Box>
				</Stack>
			</Card>
		</>
	);
};

export default SearchResultCard;

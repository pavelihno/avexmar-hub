import React, { useState } from 'react';

import {
	Card,
	Box,
	Typography,
	Button,
	Divider,
	Skeleton,
	Stack,
	Collapse,
	ClickAwayListener,
	Paper,
	useMediaQuery,
	IconButton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import FlightIcon from '@mui/icons-material/Flight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { UI_LABELS, DATE_WEEKDAY_FORMAT } from '../../constants';
import { formatDate, formatTime, formatDuration } from '../utils';
import SelectTicketDialog from './SelectTicketDialog';

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
					<Skeleton variant='circular' width={36} height={36} />
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

const Segment = ({ flight, isOutbound, noteTooltip, onToggleNote, isMobile }) => {
	if (!flight) return null;

	const airline = flight.airline || {};
	const route = flight.route || {};
	const originAirport = route.origin_airport || {};
	const destinationAirport = route.destination_airport || {};
	const hasNote = Boolean(flight.note);
	const theme = useTheme();
	const isNoteOpen = noteTooltip.open && noteTooltip.flightId === flight.id;

	return (
		<Box sx={{ mb: 1 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
					alignItems: isMobile ? 'flex-start' : 'center',
					rowGap: isMobile ? 1 : 0,
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

				<Box
					sx={{
						display: 'flex',
						justifyContent: isMobile ? 'flex-start' : 'flex-end',
						textAlign: isMobile ? 'left' : 'right',
						mt: isMobile ? 1 : 0,
					}}
				>
					{hasNote && (
						<IconButton
							size='small'
							onClick={(e) => {
								e.stopPropagation();
								onToggleNote(flight.id, flight.note);
							}}
							sx={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								border: `1px solid ${alpha(theme.palette.primary.main, isNoteOpen ? 0.4 : 0.3)}`,
								color: isNoteOpen ? theme.palette.primary.main : theme.palette.text.secondary,
								bgcolor: isNoteOpen ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
								'&:hover': {
									bgcolor: alpha(theme.palette.primary.main, 0.16),
								},
							}}
							aria-label={UI_LABELS.SEARCH.flight_details.flight_note}
							aria-pressed={isNoteOpen}
						>
							<InfoOutlinedIcon fontSize='small' />
						</IconButton>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
					alignItems: isMobile ? 'flex-start' : 'center',
					rowGap: isMobile ? 1 : 0,
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

				<Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
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
			<Collapse in={isNoteOpen} timeout='auto' unmountOnExit>
				<Paper
					variant='outlined'
					onClick={(e) => e.stopPropagation()}
					sx={{
						mt: 1.5,
						p: { xs: 1.5, sm: 2 },
						backgroundColor: alpha(theme.palette.primary.main, 0.05),
						borderColor: alpha(theme.palette.primary.main, 0.25),
					}}
				>
					<Typography
						variant='subtitle2'
						sx={{
							fontWeight: 600,
							mb: 0.75,
							fontSize: { xs: '0.8rem', sm: '0.875rem' },
							textTransform: 'uppercase',
							letterSpacing: 0.6,
						}}
					>
						{UI_LABELS.SEARCH.flight_details.flight_note}
					</Typography>
					<Typography
						variant='body2'
						sx={{
							whiteSpace: 'pre-wrap',
							fontSize: { xs: '0.85rem', sm: '0.9rem' },
							lineHeight: 1.6,
						}}
					>
						{flight.note}
					</Typography>
				</Paper>
			</Collapse>
		</Box>
	);
};

const SearchResultCard = ({ outbound, returnFlight, isLoading }) => {
	const theme = useTheme();

	const [openDialog, setOpenDialog] = useState(false);
	const [noteTooltip, setNoteTooltip] = useState({ open: false, flightId: null, note: '' });

	const handleToggleNote = (flightId, note) => {
		setNoteTooltip((prev) => ({
			open: prev.flightId === flightId ? !prev.open : true,
			flightId,
			note,
		}));
	};

	const handleCloseNote = () => {
		setNoteTooltip({ open: false, flightId: null, note: '' });
	};

	const currency = outbound?.currency || returnFlight?.currency;

	const isMinPrice = outbound?.min_price || returnFlight?.min_price;
	const totalPrice =
		(outbound?.price || outbound?.min_price || 0) + (returnFlight?.price || returnFlight?.min_price || 0);

	const priceText = isMinPrice
		? UI_LABELS.SEARCH.flight_details.price_from(totalPrice, currency)
		: UI_LABELS.SEARCH.flight_details.price_exact(totalPrice, currency);
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
									{UI_LABELS.SEARCH.flight_details.price_per_passenger}
								</Typography>
							</>
						)}
						<Button
							variant='contained'
							color='orange'
							disabled={isLoading}
							sx={{
								borderRadius: 2,
								boxShadow: 'none',
								textTransform: 'none',
								whiteSpace: 'nowrap',
							}}
							onClick={(e) => {
								e.currentTarget.blur();
								setOpenDialog(true);
							}}
						>
							{UI_LABELS.SEARCH.flight_details.select_tariff_title}
						</Button>
					</Box>
					<Box sx={{ flexGrow: 1, pl: { md: 2 } }}>
						{isLoading ? (
							<>
								<SegmentSkeleton />
								{returnFlight && <Divider sx={{ my: 1 }} />}
								{returnFlight && <SegmentSkeleton />}
							</>
						) : (
							<ClickAwayListener
								onClickAway={(event) => {
									if (noteTooltip.open) {
										handleCloseNote();
									}
								}}
								mouseEvent='onMouseDown'
								touchEvent='onTouchStart'
							>
								<Box>
									<Segment
										flight={outbound}
										isOutbound
										noteTooltip={noteTooltip}
										onToggleNote={handleToggleNote}
										isMobile={isMobile}
									/>
									{returnFlight && <Divider sx={{ my: 1 }} />}
									{returnFlight && (
										<Segment
											flight={returnFlight}
											isOutbound={false}
											noteTooltip={noteTooltip}
											onToggleNote={handleToggleNote}
											isMobile={isMobile}
										/>
									)}
								</Box>
							</ClickAwayListener>
						)}
					</Box>
				</Stack>
			</Card>
			<SelectTicketDialog
				open={openDialog}
				onClose={() => setOpenDialog(false)}
				outbound={outbound}
				returnFlight={returnFlight}
			/>
		</>
	);
};

export default SearchResultCard;

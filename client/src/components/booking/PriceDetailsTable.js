import React from 'react';
import {
	Box,
	Typography,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	TableContainer,
	Divider,
	Paper,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { formatNumber } from '../utils';

const PriceDetailsTable = ({ priceDetails, currencySymbol, flightMap, showDetails = true }) => {
	if (!priceDetails) {
		return null;
	}

	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{ mb: 4 }}>
			<Divider sx={{ mb: 2 }} />
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
				<Typography color='text.secondary' sx={{ fontWeight: 'bold' }}>
					{UI_LABELS.BOOKING.buyer_form.summary.tickets}
				</Typography>
				<Typography>{`${formatNumber(priceDetails.fare_price || 0)} ${currencySymbol}`}</Typography>
			</Box>
			{priceDetails.fees?.length > 0 &&
				priceDetails.fees.map((fee, idx) => (
					<Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
						<Typography color='text.secondary' sx={{ fontWeight: 'bold' }}>
							{fee.name}
						</Typography>
						<Typography>{`${formatNumber(fee.total)} ${currencySymbol}`}</Typography>
					</Box>
				))}
			{priceDetails.total_discounts > 0 && (
				<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Typography color='text.secondary' sx={{ fontWeight: 'bold' }}>
						{UI_LABELS.BOOKING.buyer_form.summary.discount}
					</Typography>
					<Typography>{`- ${formatNumber(priceDetails.total_discounts)} ${currencySymbol}`}</Typography>
				</Box>
			)}
			{showDetails && (
				<>
					<Divider sx={{ my: 2 }} />

					{(priceDetails.directions || []).map((dir) => {
						const info = flightMap[dir.direction] || {};
						return (
							<Box key={dir.direction} sx={{ mb: 3 }}>
								<Box sx={{ mb: 1 }}>
									<Typography variant='subtitle1' sx={{ fontWeight: 'bold', mb: 1 }}>
										{UI_LABELS.SCHEDULE.from_to(info.from, info.to)}
									</Typography>
									<Typography variant='subtitle2' color='text.secondary' sx={{ fontWeight: 600 }}>
										{`${ENUM_LABELS.SEAT_CLASS[dir.tariff.seat_class]} — ${dir.tariff.title}`}
									</Typography>
									{dir.tariff.hand_luggage > 0 && (
										<Typography variant='body2' color='text.secondary'>
											{`${UI_LABELS.SEARCH.flight_details.hand_luggage(dir.tariff.hand_luggage)}`}
										</Typography>
									)}

									{dir.tariff.baggage > 0 && (
										<Typography variant='body2' color='text.secondary'>
											{`${UI_LABELS.SEARCH.flight_details.baggage(dir.tariff.baggage)}`}
										</Typography>
									)}
								</Box>
								{isXs ? (
									// Mobile: cards per passenger category
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
										{dir.passengers.map((p) => {
											const categoryLabel =
												UI_LABELS.BOOKING.confirmation.passenger_categories[p.category];
											const unitFare = `${formatNumber(
												p.unit_fare_price || 0
											)} ${currencySymbol}`;
											const unitDiscount =
												p.unit_discount > 0
													? `- ${formatNumber(p.unit_discount)} ${currencySymbol}${
															p.discount_name ? ` (${p.discount_name})` : ''
													  }`
													: '-';
											const finalPrice = `${formatNumber(p.price)} ${currencySymbol}`;
											return (
												<Paper key={p.category} variant='outlined' sx={{ p: 1.5 }}>
													<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
														{categoryLabel}
													</Typography>
													<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
														<Typography color='text.secondary'>
															{UI_LABELS.BOOKING.confirmation.price_details.quantity}
														</Typography>
														<Typography>{p.count}</Typography>
													</Box>
													<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
														<Typography color='text.secondary'>
															{
																UI_LABELS.BOOKING.confirmation.price_details
																	.unit_fare_price
															}
														</Typography>
														<Typography>{unitFare}</Typography>
													</Box>
													<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
														<Typography color='text.secondary'>
															{UI_LABELS.BOOKING.confirmation.price_details.unit_discount}
														</Typography>
														<Typography>{unitDiscount}</Typography>
													</Box>
													<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
														<Typography color='text.secondary'>
															{UI_LABELS.BOOKING.confirmation.price_details.final_price}
														</Typography>
														<Typography>{finalPrice}</Typography>
													</Box>
												</Paper>
											);
										})}
									</Box>
								) : (
									// Desktop: table view
									<TableContainer sx={{ overflowX: 'auto' }}>
										<Table size='small'>
											<TableHead>
												<TableRow>
													<TableCell />
													<TableCell align='right'>
														{UI_LABELS.BOOKING.confirmation.price_details.quantity}
													</TableCell>
													<TableCell align='right'>
														{UI_LABELS.BOOKING.confirmation.price_details.unit_fare_price}
													</TableCell>
													<TableCell align='right'>
														{UI_LABELS.BOOKING.confirmation.price_details.unit_discount}
													</TableCell>
													<TableCell align='right'>
														{UI_LABELS.BOOKING.confirmation.price_details.final_price}
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{dir.passengers.map((p) => (
													<TableRow key={p.category}>
														<TableCell>
															{
																UI_LABELS.BOOKING.confirmation.passenger_categories[
																	p.category
																]
															}
														</TableCell>
														<TableCell align='right'>{p.count}</TableCell>
														<TableCell align='right'>{`${formatNumber(
															p.unit_fare_price || 0
														)} ${currencySymbol}`}</TableCell>
														<TableCell align='right'>
															{p.unit_discount > 0
																? `- ${formatNumber(
																		p.unit_discount
																  )} ${currencySymbol}${
																		p.discount_name ? ` (${p.discount_name})` : ''
																  }`
																: '-'}
														</TableCell>
														<TableCell align='right'>{`${formatNumber(
															p.price
														)} ${currencySymbol}`}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Box>
						);
					})}
				</>
			)}
		</Box>
	);
};

export default PriceDetailsTable;

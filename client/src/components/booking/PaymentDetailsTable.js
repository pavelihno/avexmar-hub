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
	Paper,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ENUM_LABELS, FIELD_LABELS } from '../../constants';
import { formatNumber, formatDateTime } from '../utils';

const PaymentDetailsTable = ({ payments = [] }) => {
	if (!payments || payments.length === 0) {
		return null;
	}

	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box>
			{isXs ? (
				// Mobile: cards per payment
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{payments.map((payment, index) => (
						<Paper key={index} variant='outlined' sx={{ p: 1.5 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.payment_method}</Typography>
								<Typography>
									{ENUM_LABELS.PAYMENT_METHOD[payment.payment_method] || payment.payment_method}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>
									{FIELD_LABELS.PAYMENT.provider_payment_id}
								</Typography>
								<Typography>{payment.provider_payment_id || '—'}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.payment_status}</Typography>
								<Typography>
									{ENUM_LABELS.PAYMENT_STATUS[payment.payment_status] || payment.payment_status}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.amount}</Typography>
								<Typography sx={{ fontWeight: 'bold' }}>
									{formatNumber(payment.amount || 0)}{' '}
									{ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.paid_at}</Typography>
								<Typography>{payment.paid_at ? formatDateTime(payment.paid_at) : '—'}</Typography>
							</Box>
						</Paper>
					))}
				</Box>
			) : (
				// Desktop: table view
				<TableContainer sx={{ overflowX: 'auto' }}>
					<Table size='small'>
						<TableHead>
							<TableRow>
								<TableCell>{FIELD_LABELS.PAYMENT.payment_method}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.provider_payment_id}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.payment_status}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.amount}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.paid_at}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{payments.map((payment, index) => (
								<TableRow key={index}>
									<TableCell>
										{ENUM_LABELS.PAYMENT_METHOD[payment.payment_method] || payment.payment_method}
									</TableCell>
									<TableCell>{payment.provider_payment_id || '—'}</TableCell>
									<TableCell>
										{ENUM_LABELS.PAYMENT_STATUS[payment.payment_status] || payment.payment_status}
									</TableCell>
									<TableCell>
										{formatNumber(payment.amount || 0)}{' '}
										{ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency}
									</TableCell>
									<TableCell>{payment.paid_at ? formatDateTime(payment.paid_at) : '—'}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default PaymentDetailsTable;

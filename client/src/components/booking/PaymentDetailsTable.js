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

	const paymentsData = React.useMemo(() => {
		return payments.map((payment, index) => {
			const type = payment.payment_type || payment.type;
			return {
				key: index,
				paymentMethod: ENUM_LABELS.PAYMENT_METHOD[payment.payment_method] || payment.payment_method,
				paymentType: ENUM_LABELS.PAYMENT_TYPE[type] || type || '—',
				providerPaymentId: payment.provider_payment_id || '—',
				paymentStatus: ENUM_LABELS.PAYMENT_STATUS[payment.payment_status] || payment.payment_status,
				amount: `${formatNumber(payment.amount || 0)} ${
					ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency
				}`,
				paidAt: payment.paid_at ? formatDateTime(payment.paid_at) : '—',
			};
		});
	}, [payments]);

	return (
		<Box>
			{isXs ? (
				// Mobile: cards per payment
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{paymentsData.map((data) => (
						<Paper key={data.key} variant='outlined' sx={{ p: 1.5 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.payment_type}</Typography>
								<Typography>{data.paymentType}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>
									{FIELD_LABELS.PAYMENT.provider_payment_id}
								</Typography>
								<Typography>{data.providerPaymentId}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.payment_status}</Typography>
								<Typography>{data.paymentStatus}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.amount}</Typography>
								<Typography sx={{ fontWeight: 'bold' }}>{data.amount}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography color='text.secondary'>{FIELD_LABELS.PAYMENT.paid_at}</Typography>
								<Typography>{data.paidAt}</Typography>
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
								<TableCell>{FIELD_LABELS.PAYMENT.payment_type}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.provider_payment_id}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.payment_status}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.amount}</TableCell>
								<TableCell>{FIELD_LABELS.PAYMENT.paid_at}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paymentsData.map((data) => (
								<TableRow key={data.key}>
									<TableCell>{data.paymentType}</TableCell>
									<TableCell>{data.providerPaymentId}</TableCell>
									<TableCell>{data.paymentStatus}</TableCell>
									<TableCell>{data.amount}</TableCell>
									<TableCell>{data.paidAt}</TableCell>
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

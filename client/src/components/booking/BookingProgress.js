import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Stepper, Step, StepLabel, Typography, Tabs, Tab, Box, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { useBookingAccess } from '../../context/BookingAccessContext';
import { UI_LABELS } from '../../constants';
import { useExpiryCountdown } from '../utils';

const stepKeys = ['passengers', 'confirmation', 'payment', 'completion'];

const iconMap = {
	passengers: GroupIcon,
	confirmation: FactCheckIcon,
	payment: PaymentIcon,
	completion: CheckCircleIcon,
};

const StepIcon = ({ icon, color }) => {
	const stepKey = stepKeys[icon - 1];
	const Icon = iconMap[stepKey];
	return Icon ? <Icon sx={{ color, fontSize: { xs: 32, sm: 24 } }} /> : null;
};

const BookingProgress = ({ activeStep }) => {
	const { accessiblePages = [] } = useBookingAccess();
	const { publicId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	// Get expires_at from booking or payment state depending on the active step
	const booking = useSelector((state) => state.bookingProcess?.current);
	const payment = useSelector((state) => state.payment?.current);

	const expiresAt = activeStep === 'payment' ? payment?.expires_at : booking?.expires_at;
	const timeLeft = useExpiryCountdown(expiresAt);
	const paymentStatus = payment?.payment_status;

	const showTimer = timeLeft && activeStep !== 'completion' && !['succeeded', 'canceled'].includes(paymentStatus);

	const routes = [
		`/booking/${publicId}/passengers`,
		`/booking/${publicId}/confirmation`,
		`/booking/${publicId}/payment`,
		`/booking/${publicId}/completion`,
	];

	const stepIndex = typeof activeStep === 'string' ? stepKeys.indexOf(activeStep) : activeStep;
	const appendQuery = (path) => (location.search ? `${path}${location.search}` : path);

	if (isMobile) {
		return (
			<Box sx={{ mt: 2, mb: 3 }}>
				{showTimer && (
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
						<Tooltip
							title={UI_LABELS.BOOKING.timer_tooltip}
							arrow
							placement='left'
							enterTouchDelay={0}
							leaveTouchDelay={3000}
							slotProps={{
								tooltip: {
									sx: {
										bgcolor: 'rgba(0, 0, 0, 0.87)',
										fontSize: '0.875rem',
										py: 1,
										px: 1.5,
									},
								},
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
								<AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
								<Typography variant='h6' sx={{ fontWeight: 600, color: 'text.primary' }}>
									{timeLeft}
								</Typography>
							</Box>
						</Tooltip>
					</Box>
				)}
				<Tabs
					value={stepIndex}
					onChange={(_e, val) => {
						const key = stepKeys[val];
						if (accessiblePages.includes(key)) navigate(appendQuery(routes[val]));
					}}
					variant='scrollable'
					scrollButtons='auto'
					allowScrollButtonsMobile
					aria-label='booking progress'
					sx={{ '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' } }}
				>
					{stepKeys.map((key, index) => {
						const isActive = index === stepIndex;
						const isAccessible = accessiblePages.includes(key);
						const Icon = iconMap[key];
						const color = isActive ? 'primary.main' : isAccessible ? 'success.main' : 'text.disabled';

						return (
							<Tab
								key={key}
								icon={<Icon sx={{ color, fontSize: { xs: 32, sm: 24 } }} />}
								label={UI_LABELS.BOOKING.progress_steps[key]}
								disabled={!isAccessible}
							/>
						);
					})}
				</Tabs>
			</Box>
		);
	}

	return (
		<Box>
			{showTimer && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, mt: 2 }}>
					<Tooltip
						title={UI_LABELS.BOOKING.timer_tooltip}
						arrow
						placement='left'
						enterTouchDelay={0}
						leaveTouchDelay={3000}
						slotProps={{
							tooltip: {
								sx: {
									bgcolor: 'rgba(0, 0, 0, 0.87)',
									fontSize: '0.875rem',
									py: 1,
									px: 1.5,
								},
							},
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
							<AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
							<Typography variant='h6' sx={{ fontWeight: 600, color: 'text.primary' }}>
								{timeLeft}
							</Typography>
						</Box>
					</Tooltip>
				</Box>
			)}
			<Stepper activeStep={stepIndex} alternativeLabel sx={{ mt: 2, mb: 3 }}>
				{stepKeys.map((key, index) => {
					const isActive = index === stepIndex;
					const isAccessible = accessiblePages.includes(key);

					const iconColor = isActive ? 'primary.main' : isAccessible ? 'success.main' : 'text.disabled';

					return (
						<Step
							key={key}
							completed={!isActive && isAccessible}
							disabled={!isAccessible}
							sx={{
								pointerEvents: isAccessible ? 'auto' : 'none',
								'& .MuiStepIcon-root': { cursor: isAccessible ? 'pointer' : 'default' },
								'& .MuiStepLabel-label': { cursor: isAccessible ? 'pointer' : 'default' },
								'& .MuiStepLabel-labelContainer': { cursor: isAccessible ? 'pointer' : 'default' },
							}}
						>
							<StepLabel
								onClick={() => {
									if (isAccessible) navigate(appendQuery(routes[index]));
								}}
								sx={{ cursor: isAccessible ? 'pointer' : 'default' }}
								slots={{
									stepIcon: (props) => <StepIcon {...props} color={iconColor} />,
								}}
							>
								<Typography
									variant='subtitle1'
									sx={{ color: iconColor, fontWeight: isActive ? 600 : 400 }}
								>
									{UI_LABELS.BOOKING.progress_steps[key]}
								</Typography>
							</StepLabel>
						</Step>
					);
				})}
			</Stepper>
		</Box>
	);
};

export default BookingProgress;

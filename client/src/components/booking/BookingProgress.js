import { Stepper, Step, StepLabel, Typography, Tabs, Tab, Box, useMediaQuery, useTheme } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

import { useBookingAccess } from '../../context/BookingAccessContext';
import { UI_LABELS } from '../../constants';

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
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const routes = [
		`/booking/${publicId}/passengers`,
		`/booking/${publicId}/confirmation`,
		`/booking/${publicId}/payment`,
		`/booking/${publicId}/completion`,
	];

	const stepIndex = typeof activeStep === 'string' ? stepKeys.indexOf(activeStep) : activeStep;

	if (isMobile) {
		return (
			<Box sx={{ mt: 2, mb: 3 }}>
				<Tabs
					value={stepIndex}
					onChange={(_e, val) => {
						const key = stepKeys[val];
						if (accessiblePages.includes(key)) navigate(routes[val]);
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
								if (isAccessible) navigate(routes[index]);
							}}
							StepIconComponent={(props) => <StepIcon {...props} color={iconColor} />}
							sx={{ cursor: isAccessible ? 'pointer' : 'default' }}
						>
							<Typography variant='subtitle1' sx={{ color: iconColor, fontWeight: isActive ? 600 : 400 }}>
								{UI_LABELS.BOOKING.progress_steps[key]}
							</Typography>
						</StepLabel>
					</Step>
				);
			})}
		</Stepper>
	);
};

export default BookingProgress;
